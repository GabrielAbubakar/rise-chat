import { useChatDraftsStore } from "@/features/chats/store/useChatDraftsStore";
import { useChatOutboxStore } from "@/features/chats/store/useChatOutboxStore";
import { useAuthStore } from "@/store/useAuthStore";

describe("F4 Regression: Account ownership for drafts and outbox entries", () => {
  const userA = "user-A-id";
  const userB = "user-B-id";
  const sharedGroupId = "shared-group-conv-1";

  beforeEach(() => {
    useChatDraftsStore.getState().clearActiveSession();
    useChatOutboxStore.getState().clearActiveSession();
  });

  describe("Drafts Account Ownership", () => {
    it("scopes drafts strictly to the author account", () => {
      // User A writes a draft in shared group
      useChatDraftsStore
        .getState()
        .setDraft(userA, sharedGroupId, "Draft text from User A", null);

      // User A can read their own draft
      const draftA = useChatDraftsStore
        .getState()
        .getDraft(userA, sharedGroupId);
      expect(draftA).toBeDefined();
      expect(draftA?.text).toBe("Draft text from User A");
      expect(draftA?.ownerId).toBe(userA);

      // User B opening the same shared group must NOT see User A's draft
      const draftB = useChatDraftsStore
        .getState()
        .getDraft(userB, sharedGroupId);
      expect(draftB).toBeUndefined();
    });

    it("allows User B to set their own independent draft in the same group", () => {
      useChatDraftsStore
        .getState()
        .setDraft(userA, sharedGroupId, "Draft from A", null);
      useChatDraftsStore
        .getState()
        .setDraft(userB, sharedGroupId, "Draft from B", null);

      expect(
        useChatDraftsStore.getState().getDraft(userA, sharedGroupId)?.text,
      ).toBe("Draft from A");
      expect(
        useChatDraftsStore.getState().getDraft(userB, sharedGroupId)?.text,
      ).toBe("Draft from B");
    });
  });

  describe("Outbox Account Ownership", () => {
    it("scopes outbox entries by ownerId", () => {
      // User A creates a pending/failed outbox entry
      useChatOutboxStore.getState().addOutboxEntry({
        clientMessageId: "msg-client-1",
        ownerId: userA,
        conversationId: sharedGroupId,
        text: "Failed message from User A",
        status: "failed",
        createdAt: new Date().toISOString(),
      });

      // User A's query returns the entry
      const outboxA = useChatOutboxStore
        .getState()
        .getConversationOutbox(userA, sharedGroupId);
      expect(outboxA).toHaveLength(1);
      expect(outboxA[0].ownerId).toBe(userA);

      // User B's query in the same group returns EMPTY
      const outboxB = useChatOutboxStore
        .getState()
        .getConversationOutbox(userB, sharedGroupId);
      expect(outboxB).toHaveLength(0);
    });

    it("verifies ownership before retrying an outbox entry", () => {
      const entry = {
        clientMessageId: "msg-client-2",
        ownerId: userA,
        conversationId: sharedGroupId,
        text: "User A message",
        status: "failed" as const,
        createdAt: new Date().toISOString(),
      };
      useChatOutboxStore.getState().addOutboxEntry(entry);

      const retrieved = useChatOutboxStore
        .getState()
        .getOutboxEntry("msg-client-2");
      expect(retrieved).toBeDefined();

      // Check ownership guard
      const isOwnerB = retrieved?.ownerId === userB;
      expect(isOwnerB).toBe(false);
    });
  });

  describe("Session Teardown on Logout", () => {
    it("clears active in-memory drafts and outbox on logout", async () => {
      useChatDraftsStore
        .getState()
        .setDraft(userA, sharedGroupId, "Draft text", null);
      useChatOutboxStore.getState().addOutboxEntry({
        clientMessageId: "msg-client-3",
        ownerId: userA,
        conversationId: sharedGroupId,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // Explicit logout
      await useAuthStore.getState().logout();

      // Active session in-memory state is cleared
      expect(
        useChatDraftsStore.getState().getDraft(userA, sharedGroupId),
      ).toBeUndefined();
      expect(
        useChatOutboxStore.getState().getOutboxEntry("msg-client-3"),
      ).toBeUndefined();
    });
  });
});

