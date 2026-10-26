# Code Review: Chat App (Expo / React Native)

**Reviewer summary:** The project has a good feature-based structure and substantial API integration, especially around conversation management, optimistic messages, and profile media. The next step is making those flows dependable under failure and reconnect conditions.

**Priorities:** onboarding avatar assignment, authentication and socket lifecycle, draft/retry recovery, and cache updates. Also finish or clearly disable controls that currently only look functional, such as block, leave group, and Face ID.

**For resubmission:** demonstrate the lifecycle and recovery scenarios, not only the successful flow.

## Contents

1. [Architecture and components](#module-1--architecture-and-components)
2. [Types and state ownership](#module-2--types-and-state-ownership)
3. [Authentication lifecycle](#module-3--authentication-lifecycle)
4. [Async work and lifecycle](#module-4--async-work-and-lifecycle)
5. [Reliable messaging](#module-5--reliable-messaging)
6. [Media and permissions](#module-6--media-and-permissions)
7. [Navigation and accessibility](#module-7--navigation-and-accessibility)

---

## Module 1 — Architecture and components

**Expected outcome:** Screens assemble the interface; hooks coordinate behavior; services handle external communication; shared components remain reusable.

### What is working well

- The project separates routing, features, shared components, services, and stores.
- Route files generally delegate to feature screens. The chat route is a good example.
- Chat composition is split into useful components such as `ChatHeader`, `ChatInputBar`, `ChatMessageItem`, and `AttachmentPreviewBar`.
- Search, sending, and realtime behavior have dedicated hooks.
- This is a useful foundation to preserve.

### What needs improvement

**1. Custom mutation callbacks can disable essential internal behavior.**

- Several hooks define their own callbacks and then spread `...options` afterward.
- In `useCreateDirectConversation`, supplying an `onSuccess` callback replaces the hook's callback, including its chat-list invalidation.
- The new-chat sheet supplies precisely such a callback. Navigation runs, but the intended cache update is bypassed.
- Confirmed in an isolated check.

**Recommended change:** Compose callbacks explicitly. Internal cache maintenance should always execute, followed by the consumer's callback. Apply the same rule to rollback and settlement callbacks in the generic optimistic-mutation hook.

**2. Upload and contact-discovery workflows are duplicated.**

- Upload orchestration appears independently in onboarding, profile editing, group creation, and chat sending.
- These implementations have already diverged: profile editing uses the correct avatar endpoint, while onboarding does not.
- The group-creation component also coordinates group creation, upload, contact access, contact matching, and navigation.
- The issue is not simply file length. Multiple components own the same business workflow.

**Recommended change:** Extract:

- A media-upload operation that returns a verified media asset.
- A contact-discovery hook for permission, normalization, batching, and matching.
- A group-creation coordinator that handles partial success explicitly.

Keep the final destination operation (setting an avatar or sending an attachment) separate from uploading.

### Practical assignment

Refactor one upload workflow and reuse it from onboarding and profile editing.

Submit:

- A short responsibility map.
- The shared upload implementation.
- Evidence that consumer callbacks still run without replacing internal cache updates.

**Teaching question:** What belongs in a reusable upload service, and what belongs in the screen-specific hook?

---

## Module 2 — Types and state ownership

**Expected outcome:** Types represent real API data and valid UI states; each piece of state has a clear owner.

### What is working well

- Direct and group conversations form a discriminated union.
- Conversation settings include meaningful server fields such as `mutedUntil` and `clearedThroughMessageId`.
- Conversation queries append the current user's ID to their cache keys.
- Server data generally lives in React Query, while transient UI state stays local.

### What needs improvement

**1. REST, realtime, and media types have drifted apart.**

Examples:

- REST messages allow text, image, audio, video, and document kinds.
- The realtime message payload only declares `"text"`.
- `MediaAssetResponseDto.type` only allows image and audio.
- Message types omit the version, deletion, reply, and reaction information supported by the current contract.
- Meanwhile, `any` in cache updates and mutation arguments hides these inconsistencies.

**Recommended change:**

- Establish a canonical message model shared by REST and socket handling.
- Type the paginated cache with `InfiniteData<MessageHistoryResponseDto>`.
- Represent pending/failed local messages separately from confirmed server messages.
- Types alone do not validate incoming JSON; validate important external boundaries too.

**2. Some server-facing settings are only local visual state.**

- The conversation notification switch starts as `true` and only calls `setNotificationsEnabled`.
- It neither reads nor updates the conversation's mute settings.

**Recommended change:** If this switch means "mute this conversation," derive it from server settings and call the mute/unmute mutations. If it means something else, define that behavior explicitly.

**3. Form defaults can become fabricated user data.**

- The edit-profile form initializes the name to `"Roberto William"` and the phone number to a sample number when profile data is unavailable.
- Those `useState` initializers do not automatically update when the real profile arrives.
- A cold load or direct navigation could therefore show, and potentially save, a placeholder name.

**Recommended change:** Wait for profile loading, initialize the form from actual data, and preserve dirty edits during later refetches.

### Practical assignment

Produce a state-ownership map covering:

- Server messages and conversation settings.
- Pending outgoing messages.
- Composer drafts.
- Authentication and device preferences.

Then remove `any` from the send-message and message-cache paths.

**Acceptance:** An image socket event fits the same canonical model as an image REST response; loading a profile never creates a fictional user value.

**Teaching question:** Why should `mutedUntil` come from server state while "mute menu is open" remains component state?

---

## Module 3 — Authentication lifecycle

**Expected outcome:** Login, restart, refresh, logout, and account switching behave consistently, including when operations overlap.

### What is working well

- Tokens use Expo SecureStore.
- Concurrent unauthorized requests share a refresh operation.
- Logout clears both the in-memory query cache and persisted query cache.
- The settings logout mutation performs local cleanup when the server request settles, including failure.

### What needs improvement

**1. An old refresh can write credentials after logout.**

The refresh handler always saves returned tokens, without checking whether the initiating session is still current.

Reproducible sequence:

1. Account A starts a refresh.
2. Local logout clears its credentials.
3. The outstanding refresh finishes.
4. Account A's tokens are written back.

The late write was confirmed in isolation. Account switching makes this especially important.

**Recommended change:**

- Use a session generation/identifier. Logout invalidates that generation immediately; refresh results and queued request replays must verify it before proceeding.
- Add bounded request timeouts.
- Distinguish temporary network failure from rejected credentials.

**2. HTTP refresh does not refresh the socket session.**

- The realtime provider captures a token when authentication becomes true. It does not respond to subsequent token rotation.
- Its disconnect and connection-error handlers only change status.
- The backend disconnects sockets when their access token expires. `reconnection: true` does not recover a server-forced disconnect automatically; Socket.IO documents that distinction (see the Socket.IO client `Socket` lifecycle documentation).

**Recommended change:** Coordinate HTTP and socket authentication through the same session service. Handle authentication-related disconnections, obtain current credentials, reconnect deliberately, and resynchronize data.

**3. PIN ownership and the advertised biometric feature need clarification.**

- Normal logout does not reset the security store; the reset only happens in the no-refresh-token branch.
- The stored PIN also uses a single global key, so account B can inherit account A's PIN configuration.
- Separately, the Face ID screen displays a front-camera preview; it does not perform biometric authentication.

**Recommended change:**

- Define whether the PIN is installation-wide or account-specific, implement that policy consistently, and provide recovery.
- Do not present the camera preview as a functioning security feature.
- Actual biometric unlocking should use the operating system's authentication mechanism.

**4. OTP length is hard-coded despite being supplied by the API.**

- The challenge response includes `codeLength`, but the OTP component defaults to four digits and the screen does not pass the returned length.

**Recommended change:** Carry the challenge's length and expiration through the flow, including resend responses.

### Practical assignment

Demonstrate:

- Cold restart with valid credentials.
- Access-token expiry while a chat remains open.
- Logout while refresh is pending.
- Account A → logout → account B.
- A challenge with a different OTP length.
- The intended PIN behavior after switching accounts.

**Teaching question:** Why is clearing token storage insufficient if an old asynchronous operation can write to it afterward?

---

## Module 4 — Async work and lifecycle

**Expected outcome:** Work is scoped to the current screen/session, listeners are cleaned up, and reconnecting restores correct state.

### What is working well

- Chat socket listeners are removed using their registered handlers.
- Keyboard and back-button listeners have cleanup.
- Contact-loading effects check whether they are still active after permission and device-contact calls.
- User searches use query-specific cache keys and a minimum-length condition.

### What needs improvement

**1. Reconnection signals do not trigger reconciliation.**

`RealtimeProvider` increments `reconcileVersion` on connection and `activityVersion` on message/receipt activity, but neither value is consumed elsewhere in `src`. Consequently:

- The main chat list is not refreshed by those events.
- Missed messages are not explicitly recovered after reconnecting.
- Presence subscriptions are not re-established merely because the same socket reconnects.

Also, setting `refetchOnWindowFocus: true` is not itself a native foreground integration. React Native requires an appropriate `AppState` connection to React Query's focus manager (see TanStack Query's React Native guidance).

**Recommended change:** Establish a reconnect/foreground coordinator that refreshes relevant server state and restores active subscriptions.

**2. Presence can identify the current user as "the other user."**

The subscription acknowledgment uses:

```ts
participants.find(p => p.userId !== undefined)
```

- That selects the first participant with an ID, not the participant other than the signed-in user.
- Confirmed: an acknowledgment containing self first produces an incorrect online indicator.
- The same hook reduces group presence and typing to one boolean, so one member stopping typing can hide another member who is still typing.

**Recommended change:** Track presence and typing by user ID, exclude self where appropriate, honor typing expiry, and reset transient state when conversation identity changes.

**3. Contact matching is not prepared for real address books.**

- All device phone numbers are sent in one request, without normalization or batching.
- The endpoint accepts at most 100 numbers per request and expects international numbers.

**Recommended change:** Normalize, deduplicate, batch, merge results, and prevent a dismissed or superseded operation from updating the next discovery session.

### Practical assignment

Demonstrate:

- Reconnect recovery.
- Two simultaneous group typists.
- A large address book.
- Closing/reopening discovery while matching is in flight.

**Acceptance:** No duplicate listeners, stale results, incorrect presence, or missing messages after reconnect.

**Teaching question:** What is the difference between reconnecting a transport and restoring application state?

---

## Module 5 — Reliable messaging

**Expected outcome:** Users can distinguish pending, failed, and confirmed messages; retries do not duplicate messages or lose content.

### What is working well

- Messages receive client-generated identifiers.
- Optimistic messages are reconciled with server responses.
- Socket handling checks server IDs and client message IDs.
- Message history uses cursor pagination, with older messages loaded from the beginning of the oldest-first list.

### What needs improvement

**1. Failure handling loses recoverable user work.**

- The sending hook clears the text and attachment before upload or message submission succeeds.
- Upload failure displays a toast but does not restore either.
- Confirmed in isolation: authorization failure leaves an empty composer and no selected attachment.
- There is also no explicit failed-message state or durable retry entry.

**Recommended change:** Move a submitted draft into an outbox entry containing its original `clientMessageId`, content, attachments, and status. Retry that same operation rather than generating a new identity.

**2. A failed send can remove an unrelated incoming message.**

- The error handler restores the entire pre-send cache snapshot.
- If another message arrives during the request, restoring that snapshot removes the new message from the local cache.
- Confirmed in isolation.

**Recommended change:** Update or remove only the optimistic entry associated with the failed operation. Do not rewind unrelated cache changes.

**3. Read/delivery state is not integrated end to end.**

- The screen marks the conversation read when it opens, but does not advance read state as new messages are viewed.
- Receipt events only increment the unused activity counter, and the message presentation has no pending/failed/delivered/read model.

**Recommended change:** Advance receipt boundaries based on focused/visible content and merge newer receipt versions. Keep "request accepted," "delivered," and "read" distinct.

**4. Chat-list pagination and search are unfinished.**

- The query supports pagination, but the main screen never calls `fetchNextPage`.
- Its search field updates state without filtering the displayed conversations.
- Failed initial loading can also appear as "No chats yet."

**Recommended change:** Wire pagination and search, and distinguish loading, empty, and error states.

> Advanced message mutations (edits, deletions, and reactions) also lack the corresponding event handling. Treat them as unfinished integration, not something covered by handling `message.created`.

### Practical assignment

Demonstrate:

- A failed send remains recoverable.
- An incoming message survives another message's failure.
- A lost response followed by retry creates one server message.
- Draft recovery after restarting.
- More than one page of conversations.
- Read state advancing while a conversation stays open.

**Teaching question:** Why must retry preserve the original client message ID?

---

## Module 6 — Media and permissions

**Expected outcome:** Media selection, validation, transfer, verification, attachment, rendering, cancellation, and permission denial form one understandable, explicit workflow.

### What is working well

- Upload authorization and completion are implemented.
- Returned Cloudinary fields are copied into multipart requests.
- Provider uploads use standalone Axios rather than the authenticated API client.
- Edit-profile correctly:
  1. Requests upload authorization.
  2. Sends the returned fields directly to Cloudinary.
  3. Calls completion.
  4. Assigns the verified `mediaId` through `/me/avatar`.
- Edit-profile also handles an already-ready upload response.
- Group creation performs real API work and uses the dedicated avatar endpoint after upload.

### What needs improvement

**1. Onboarding uses the wrong operation to assign an avatar. (High priority)**

- It uploads and completes the image, extracts `secureUrl`, and sends `avatarUrl` through `PATCH /me`.
- The API contract: `PATCH /me` accepts the display name; avatar assignment requires `PUT /me/avatar` with `{ mediaId }`. The backend's strict validation rejects the extra avatar field.
- The onboarding screen also announces "successfully uploaded" immediately after local selection, before the network upload runs.

**Recommended change:** Reuse the working media-ID attachment flow. Distinguish **selected**, **uploading**, **verified**, and **assigned/saved** states.

**2. File metadata is guessed or discarded.**

- Several paths substitute `500000` bytes as a placeholder size and infer JPEG from a URI.
- Camera and recent-photo callbacks pass only a URI, losing useful metadata.
- Documents allow `*/*` without a matching client-side allowlist.
- On iOS, MediaLibrary asset URIs can be `ph://` references rather than upload-ready local paths. The recent-photo path forwards the library URI directly (see the Expo MediaLibrary asset documentation).

**Recommended change:** Normalize every selection into a verified local URI, filename, MIME type, and actual byte size. Resolve the asset to a readable file where needed, and apply supported-type and size checks against the API's limits before authorization.

**3. Upload recovery is incomplete.**

- Chat sending only assigns `uploadedMediaId` inside `if (uploadAuth.upload)`. When authorization returns ready media with `upload: null`, the message is submitted without the attachment ID. Reproduced in isolation.
- The operation also lacks stage-specific retry, cancellation, progress, and a persistent upload identity.

**Recommended change:** Preserve the authorized media ID regardless of whether transfer is required. Keep `clientUploadId`, `mediaId`, destination, and current stage so recovery resumes from the failed stage instead of re-uploading or discarding completed work.

**4. Upload support is broader than rendering support.**

- The document picker allows arbitrary files, but every message attachment is rendered with an image component.
- A PDF, audio clip, or video needs a different presentation and interaction, so a successfully uploaded file is not yet a complete usable attachment experience.
- Shared-media tabs still use dummy data, and no voice-recording workflow was found.

**Recommended change:** Implement rendering by attachment type, or explicitly limit the current UI to supported types.

**5. Denying contacts permission unnecessarily blocks global search.**

- The permission-denied branch replaces the entire results area, including global user-search results.
- Searching server users should remain available without access to the address book.

### Practical assignment

Submit a recovery matrix covering:

- Cancellation
- Permission denial
- Oversized/unsupported files
- Transfer failure
- Completion failure
- Message-send failure after successful upload

Demonstrate:

- Image and document sending.
- An already-ready response.
- Failure at each upload stage.
- Cancellation.
- Denied contacts permission with working manual search.
- One usable example of each media type the UI claims to support. Add audio/video demonstrations only when those flows are actually implemented.

**Teaching question:** Why are "uploaded to Cloudinary" and "attached to a profile or message" different success states?

---

## Module 7 — Navigation and accessibility

**Expected outcome:** Protected destinations remain protected, navigation reflects real outcomes, and core actions work with assistive technology.

### What is working well

- Routes generally pass identifiers rather than entire server objects.
- Direct-chat creation navigates using the returned conversation ID.
- Search and selection flows include back-button handling.
- The composer accounts for keyboard and safe-area spacing.

### What needs improvement

**1. Authentication guarding misses private routes.**

- The logged-out branch only redirects `(tabs)` and `unlock`. It does not protect `/chat/...`, `/settings/...`, `/archived-chats`, or `/setup-pin`.
- Confirmed in isolated guard checks.
- This is a client navigation gap, not proof of bypassing backend authorization. It still allows private screens and their effects to mount outside the intended session flow.

**Recommended change:** Put private routes behind a structural authenticated boundary, gate them during session restoration, and provide explicit invalid/inaccessible-conversation states.

**2. Several controls promise actions they do not perform.**

- "Block contact" only navigates back.
- "Leave group" only navigates back.
- Batch-action buttons have no handlers; the trash button clears selection.
- The swipe action labeled "Delete" clears message history instead of deleting the conversation.
- Mute always uses `"always"` without offering the other durations.

**Recommended change:** Implement the stated operation or clearly disable unfinished controls. Distinguish clear history from delete chat, explain scope, and confirm destructive actions.

**3. Important controls lack explicit accessibility semantics.**

- The attachment and send buttons are icon-only without meaningful accessibility labels or roles.
- The OTP uses a zero-sized transparent input without an explicit accessible interaction model.

**Recommended change:** Add labels, roles, disabled/busy states, understandable message descriptions, and accessible alternatives to swipe-only actions. Verify with VoiceOver/TalkBack and large text (see the React Native accessibility guidance).

**4. Notification navigation is not implemented yet.**

- Although the notification dependency is installed, no device registration or notification-response routing was found in `src`.

**Recommended change:** For the eventual flow, preserve a pending conversation destination through login/unlock, validate access, and navigate once, rather than simply pushing a route from an event callback.

### Practical assignment

Submit demonstrations of:

- Opening a private chat link while logged out.
- Login/unlock followed by safe destination recovery.
- Invalid or inaccessible chat handling.
- Sending and attaching with a screen reader.
- Correct clear/delete/block/leave behavior.
- Notification navigation once implemented.

**Teaching question:** Why does a route containing a valid conversation ID still require session and access checks?
