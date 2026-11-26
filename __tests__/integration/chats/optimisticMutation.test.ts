import { QueryClient } from "@tanstack/react-query";
import {
  optimisticallyTogglePin,
  optimisticallyToggleMute,
  optimisticallyArchive,
  optimisticallyUnarchive,
} from "@/features/chats/hooks/optimisticHelpers";
import { chatsKeys } from "@/features/chats/hooks/chatsKeys";
import type {
  ConversationResponseDto,
  ConversationMemberSettingsDto,
} from "@/features/chats/types";
import { resetQueryClient } from "../../../test-utils/queryClient";

describe("F3 Regression: Granular optimistic mutation rollbacks", () => {
  let queryClient: QueryClient;
  const userId = "test-user-id";
  const listKey = [...chatsKeys.list(), userId];
  const archivedKey = [...chatsKeys.archived(), userId];

  const defaultSettings: ConversationMemberSettingsDto = {
    pinned: false,
    muted: false,
    mutedUntil: null,
    archived: false,
    favorited: false,
    archivedAt: null,
    mutedAt: null,
    pinnedAt: null,
    favoritedAt: null,
    clearedAt: null,
    clearedThroughMessageId: null,
  };

  const createMockConversation = (
    id: string,
    overrides?: {
      settings?: Partial<ConversationMemberSettingsDto>;
      lastActivityAt?: string;
    },
  ): ConversationResponseDto => ({
    id,
    type: "direct",
    otherParticipant: {
      id: `participant-${id}`,
      displayName: `User ${id}`,
      avatarUrl: null,
    },
    latestMessage: null,
    unreadCount: 0,
    lastActivityAt: overrides?.lastActivityAt ?? "2026-01-01T12:00:00.000Z",
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T12:00:00.000Z",
    settings: {
      ...defaultSettings,
      ...(overrides?.settings || {}),
    },
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        // gcTime: Infinity never schedules a GC timer, so no handle outlives the test
        queries: { retry: false, gcTime: Infinity },
        mutations: { gcTime: Infinity },
      },
    });
  });

  afterEach(() => {
    resetQueryClient(queryClient);
  });

  it("preserves concurrent successful mute when pin fails and rolls back", async () => {
    const convA = createMockConversation("conv-A", {
      settings: { pinned: false, muted: false },
    });
    const convB = createMockConversation("conv-B", {
      settings: { pinned: false, muted: false },
    });

    queryClient.setQueryData(listKey, {
      pages: [
        {
          items: [convA, convB],
          pageInfo: { hasNextPage: false, nextCursor: null },
        },
      ],
      pageParams: [undefined],
    });

    // 1. Optimistically Pin conv-A
    const pinContext = await optimisticallyTogglePin(
      queryClient,
      userId,
      "conv-A",
      true,
    );

    // Verify conv-A is pinned
    let cache = queryClient.getQueryData<any>(listKey);
    expect(
      cache.pages[0].items.find((i: any) => i.id === "conv-A").settings.pinned,
    ).toBe(true);

    // 2. Concurrently Mute conv-B (and this operation succeeds on server)
    await optimisticallyToggleMute(queryClient, userId, "conv-B", true);

    // Verify conv-B is muted
    cache = queryClient.getQueryData<any>(listKey);
    expect(
      cache.pages[0].items.find((i: any) => i.id === "conv-B").settings.muted,
    ).toBe(true);

    // 3. Pin for conv-A fails and triggers rollback
    expect(pinContext.rollback).toBeDefined();
    pinContext.rollback!(queryClient, userId);

    // 4. Verification: conv-A's pin was reverted, BUT conv-B's mute is PRESERVED!
    const finalCache = queryClient.getQueryData<any>(listKey);
    const finalItems = finalCache.pages[0].items;

    const finalA = finalItems.find((i: any) => i.id === "conv-A");
    const finalB = finalItems.find((i: any) => i.id === "conv-B");

    expect(finalA.settings.pinned).toBe(false); // Reverted
    expect(finalB.settings.muted).toBe(true); // Preserved!
  });

  it("preserves concurrent mutations when archive fails and rolls back", async () => {
    const convA = createMockConversation("conv-A");
    const convB = createMockConversation("conv-B");

    queryClient.setQueryData(listKey, {
      pages: [
        {
          items: [convA, convB],
          pageInfo: { hasNextPage: false, nextCursor: null },
        },
      ],
      pageParams: [undefined],
    });
    queryClient.setQueryData(archivedKey, {
      pages: [
        {
          items: [],
          pageInfo: { hasNextPage: false, nextCursor: null },
        },
      ],
      pageParams: [undefined],
    });

    // 1. Optimistically archive conv-A
    const archiveContext = await optimisticallyArchive(
      queryClient,
      userId,
      "conv-A",
    );

    // Concurrently mute conv-B
    await optimisticallyToggleMute(queryClient, userId, "conv-B", true);

    // 2. Archive conv-A fails and rolls back
    expect(archiveContext.rollback).toBeDefined();
    archiveContext.rollback!(queryClient, userId);

    // 3. conv-A is restored to active list (not archived), conv-B remains muted
    const activeCache = queryClient.getQueryData<any>(listKey);
    const archivedCache = queryClient.getQueryData<any>(archivedKey);

    const activeItems = activeCache.pages[0].items;
    const finalA = activeItems.find((i: any) => i.id === "conv-A");
    const finalB = activeItems.find((i: any) => i.id === "conv-B");

    expect(finalA).toBeDefined();
    expect(finalA.settings.archived).toBe(false);
    expect(finalB.settings.muted).toBe(true);

    const archivedItems = archivedCache.pages[0].items;
    expect(archivedItems.find((i: any) => i.id === "conv-A")).toBeUndefined();
  });

  it("preserves concurrent mutations when unarchive fails and rolls back", async () => {
    const convA = createMockConversation("conv-A", {
      settings: { archived: true },
    });
    const convB = createMockConversation("conv-B");

    queryClient.setQueryData(listKey, {
      pages: [
        {
          items: [convB],
          pageInfo: { hasNextPage: false, nextCursor: null },
        },
      ],
      pageParams: [undefined],
    });
    queryClient.setQueryData(archivedKey, {
      pages: [
        {
          items: [convA],
          pageInfo: { hasNextPage: false, nextCursor: null },
        },
      ],
      pageParams: [undefined],
    });

    // 1. Optimistically unarchive conv-A
    const unarchiveContext = await optimisticallyUnarchive(
      queryClient,
      userId,
      "conv-A",
    );

    // Concurrently mute conv-B in active list
    await optimisticallyToggleMute(queryClient, userId, "conv-B", true);

    // 2. Unarchive conv-A fails and rolls back
    expect(unarchiveContext.rollback).toBeDefined();
    unarchiveContext.rollback!(queryClient, userId);

    // 3. conv-A returns to archived, conv-B remains muted in active list
    const activeCache = queryClient.getQueryData<any>(listKey);
    const archivedCache = queryClient.getQueryData<any>(archivedKey);

    expect(
      activeCache.pages[0].items.find((i: any) => i.id === "conv-A"),
    ).toBeUndefined();
    expect(
      activeCache.pages[0].items.find((i: any) => i.id === "conv-B").settings
        .muted,
    ).toBe(true);
    expect(
      archivedCache.pages[0].items.find((i: any) => i.id === "conv-A"),
    ).toBeDefined();
  });
});
