/**
 * R3 — Roll back archive state without restoring stale conversation fields.
 *
 * The rollback must move the LATEST cached row back (keeping fields updated
 * while the request was in flight), change only the archive flag, keep the
 * active list, archived list and detail cache consistent, and preserve pages.
 */
import { chatsKeys } from "@/features/chats/hooks/chatsKeys";
import {
  optimisticallyArchive,
  optimisticallyUnarchive,
} from "@/features/chats/hooks/optimisticHelpers";
import type {
  ConversationListResponseDto,
  ConversationMemberSettingsDto,
  ConversationResponseDto,
} from "@/features/chats/types";
import { InfiniteData, QueryClient } from "@tanstack/react-query";

type Pages = InfiniteData<ConversationListResponseDto>;

const userId = "user-1";
const listKey = [...chatsKeys.list(), userId];
const archivedKey = [...chatsKeys.archived(), userId];
const detailKey = (id: string) => [...chatsKeys.detail(id), userId];

const settings = (overrides: Partial<ConversationMemberSettingsDto> = {}) =>
  ({
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
    ...overrides,
  }) as ConversationMemberSettingsDto;

/** `minutesAgo` sets sort order: smaller = more recent = earlier in the list */
const conv = (
  id: string,
  minutesAgo: number,
  overrides: { settings?: Partial<ConversationMemberSettingsDto>; latestMessage?: any } = {},
): ConversationResponseDto =>
  ({
    id,
    type: "direct",
    otherParticipant: { id: `p-${id}`, displayName: id, avatarUrl: null },
    latestMessage: overrides.latestMessage ?? null,
    unreadCount: 0,
    lastActivityAt: new Date(Date.UTC(2026, 0, 1, 12, 0) - minutesAgo * 60_000).toISOString(),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    settings: settings(overrides.settings),
  }) as ConversationResponseDto;

const pages = (
  ...pageItems: { items: ConversationResponseDto[]; hasNextPage?: boolean }[]
): Pages => ({
  pages: pageItems.map((p, i) => ({
    items: p.items,
    pageInfo: {
      hasNextPage: p.hasNextPage ?? i < pageItems.length - 1,
      nextCursor: p.hasNextPage ?? i < pageItems.length - 1 ? `cursor-${i + 1}` : null,
    },
  })) as ConversationListResponseDto[],
  pageParams: pageItems.map((_, i) => (i === 0 ? undefined : `cursor-${i}`)),
});

const ids = (qc: QueryClient, key: readonly unknown[]) =>
  qc.getQueryData<Pages>(key)?.pages.map((p) => p.items.map((i) => i.id));

const find = (qc: QueryClient, key: readonly unknown[], id: string) =>
  qc
    .getQueryData<Pages>(key)
    ?.pages.flatMap((p) => p.items)
    .find((i) => i.id === id);

/** Simulates a realtime/cache update to the row while the request is in flight */
const updateRow = (
  qc: QueryClient,
  key: readonly unknown[],
  id: string,
  patch: (c: ConversationResponseDto) => ConversationResponseDto,
) =>
  qc.setQueryData<Pages>(key, (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            items: p.items.map((i) => (i.id === id ? patch(i) : i)),
          })),
        }
      : old,
  );

let qc: QueryClient;
beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => qc.clear());

const newerMessage = { id: "msg-new", text: "arrived while archiving" };

describe("R3: archive rollback uses the latest row", () => {
  it("keeps a newer muted flag and latestMessage when archive fails", async () => {
    qc.setQueryData(listKey, pages({ items: [conv("a", 1), conv("b", 2)] }));
    qc.setQueryData(archivedKey, pages({ items: [conv("z", 50, { settings: { archived: true } })] }));

    const ctx = await optimisticallyArchive(qc, userId, "a");
    expect(find(qc, archivedKey, "a")?.settings.archived).toBe(true);

    // A newer version of the same row lands while the request is in flight
    updateRow(qc, archivedKey, "a", (c) => ({
      ...c,
      latestMessage: newerMessage as any,
      settings: { ...c.settings, muted: true },
    }));

    ctx.rollback!(qc, userId);

    const restored = find(qc, listKey, "a")!;
    expect(restored.settings.archived).toBe(false);
    expect(restored.settings.muted).toBe(true);
    expect(restored.latestMessage).toEqual(newerMessage);
    expect(find(qc, archivedKey, "a")).toBeUndefined();
    expect(ids(qc, listKey)).toEqual([["a", "b"]]);
  });

  it("keeps newer fields when unarchive fails", async () => {
    qc.setQueryData(listKey, pages({ items: [conv("b", 2)] }));
    qc.setQueryData(archivedKey, pages({ items: [conv("a", 1, { settings: { archived: true } })] }));

    const ctx = await optimisticallyUnarchive(qc, userId, "a");
    updateRow(qc, listKey, "a", (c) => ({
      ...c,
      latestMessage: newerMessage as any,
      settings: { ...c.settings, muted: true },
    }));

    ctx.rollback!(qc, userId);

    const restored = find(qc, archivedKey, "a")!;
    expect(restored.settings.archived).toBe(true);
    expect(restored.settings.muted).toBe(true);
    expect(restored.latestMessage).toEqual(newerMessage);
    expect(find(qc, listKey, "a")).toBeUndefined();
  });

  it("keeps active list, archived list and detail consistent through archive and rollback", async () => {
    qc.setQueryData(listKey, pages({ items: [conv("a", 1)] }));
    qc.setQueryData(archivedKey, pages({ items: [] }));
    qc.setQueryData(detailKey("a"), conv("a", 1));

    const ctx = await optimisticallyArchive(qc, userId, "a");
    expect(qc.getQueryData<ConversationResponseDto>(detailKey("a"))?.settings.archived).toBe(true);
    expect(find(qc, listKey, "a")).toBeUndefined();
    expect(find(qc, archivedKey, "a")).toBeDefined();

    // Detail is updated concurrently (e.g. mute from the detail screen)
    qc.setQueryData<ConversationResponseDto>(detailKey("a"), (d) =>
      d ? { ...d, settings: { ...d.settings, muted: true } } : d,
    );

    ctx.rollback!(qc, userId);

    const detail = qc.getQueryData<ConversationResponseDto>(detailKey("a"))!;
    expect(detail.settings.archived).toBe(false);
    expect(detail.settings.muted).toBe(true);
    expect(find(qc, listKey, "a")?.settings.archived).toBe(false);
    expect(find(qc, archivedKey, "a")).toBeUndefined();
  });

  it("preserves pagination: rollback re-inserts into the right page without collapsing pages", async () => {
    qc.setQueryData(
      listKey,
      pages({ items: [conv("c1", 1), conv("c2", 2)] }, { items: [conv("c3", 3), conv("c4", 4)], hasNextPage: false }),
    );
    qc.setQueryData(archivedKey, pages({ items: [] }));

    const ctx = await optimisticallyArchive(qc, userId, "c3");
    expect(ids(qc, listKey)).toEqual([["c1", "c2"], ["c4"]]);

    ctx.rollback!(qc, userId);

    expect(ids(qc, listKey)).toEqual([["c1", "c2"], ["c3", "c4"]]);
    const data = qc.getQueryData<Pages>(listKey)!;
    expect(data.pageParams).toEqual([undefined, "cursor-1"]);
    expect(data.pages[0].pageInfo).toEqual({ hasNextPage: true, nextCursor: "cursor-1" });
  });

  it("leaves a row that sorts into an unloaded page for the refetch instead of misplacing it", async () => {
    qc.setQueryData(listKey, pages({ items: [conv("c1", 1), conv("c2", 2)], hasNextPage: true }));
    qc.setQueryData(archivedKey, pages({ items: [conv("old", 999, { settings: { archived: true } })] }));

    const ctx = await optimisticallyUnarchive(qc, userId, "old");
    expect(ids(qc, listKey)).toEqual([["c1", "c2"]]);

    ctx.rollback!(qc, userId);
    expect(ids(qc, archivedKey)).toEqual([["old"]]);
  });

  it("does not duplicate a row that realtime re-added to the active list during archive", async () => {
    qc.setQueryData(listKey, pages({ items: [conv("a", 5), conv("b", 2)] }));
    qc.setQueryData(archivedKey, pages({ items: [] }));

    const ctx = await optimisticallyArchive(qc, userId, "a");

    // A new message re-surfaces "a" at the top of the active list
    qc.setQueryData<Pages>(listKey, (old) => ({
      ...old!,
      pages: [{ ...old!.pages[0], items: [conv("a", 0, { latestMessage: newerMessage }), ...old!.pages[0].items] }],
    }));

    ctx.rollback!(qc, userId);

    expect(ids(qc, listKey)).toEqual([["a", "b"]]);
    expect(find(qc, listKey, "a")?.latestMessage).toEqual(newerMessage);
    expect(find(qc, archivedKey, "a")).toBeUndefined();
  });

  it("does not invent an archived list that was never loaded", async () => {
    qc.setQueryData(listKey, pages({ items: [conv("a", 1)] }));

    const ctx = await optimisticallyArchive(qc, userId, "a");
    expect(qc.getQueryData(archivedKey)).toBeUndefined();

    ctx.rollback!(qc, userId);
    expect(ids(qc, listKey)).toEqual([["a"]]);
  });
});
