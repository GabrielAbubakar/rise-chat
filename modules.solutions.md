## Module 1

### Issue 1: Consumer Overwrite of Query Hook Options

**Problem**: When using custom hooks that wrap react-query mutations, consumers often want to pass additional options (like onSuccess, onError, or optimisitc updates) that override the defaults. However, the default options in the hooks are hardcoded and not properly merged with the consumer's options, leading to lost or incomplete configurations.

**Impact**: Developers cannot fully customize the behavior of mutation hooks without modifying the hook source code itself, breaking modularity and reusability.

**Root Cause**: The mutation hooks do not properly merge consumer-provided options with default options. Instead of extending the defaults, the custom options are either used directly or overwrite the defaults completely, depending on the implementation.

**Fix**: Refactor the custom hooks to properly merge consumer-provided options with default configurations. This involves:

1.  **Option Composition**: Use object spreading or merging utilities (like those from the utils package) to combine default options with consumer-provided options.
2.  **Custom Handlers**: Ensure that any success or error handlers from the consumer are properly chained or composed with the hook's default handlers.
3.  **Priority Management**: Establish clear priority rules for option merging, ensuring consumer options take precedence where intended while preserving default behavior.
4.  **Example Implementation**: Update `src/features/chats/hooks/useMessageActions.ts` to properly merge consumer options with default configurations. Update `lib/shared/services/toast.ts` and `lib/shared/components/toast.tsx` to fix toast stacking.
5.  **Verification**: Add comprehensive test coverage to ensure that both default and custom options are correctly applied in various scenarios.

### Issue 2: Unified Media Upload

**Problem**: Media upload functionality is fragmented across multiple components and services, with inconsistent APIs and duplicated logic. This makes it difficult to maintain and extend the media upload functionality.

**Impact**: Developers need to understand multiple interfaces to implement media uploads, code duplication increases, and it's harder to enforce consistent error handling and progress tracking.

**Root Cause**: Media upload logic has evolved over time in different parts of the codebase without a unified approach, leading to multiple implementations and inconsistent APIs.

**Fix**: Refactor media upload functionality into a single, reusable service. This involves:

1.  **Centralized Service**: Create a new service, `src/features/media/services.ts`, to handle all media upload operations.
2.  **Unified API**: Define a consistent interface for media uploads that includes:
    - `uploadMedia(file: File) => Promise<MediaAsset>`
    - `uploadImage(file: File) => Promise<MediaAsset>`
    - `uploadVideo(file: File) => Promise<MediaAsset>`
3.  **Reusable Logic**: Extract common upload logic (progress tracking, error handling, chunking) into shared utility functions.
4.  **Integration**: Update all components that currently handle media uploads to use the new unified service:
    - `ChatComposer.tsx` - Add media upload support
    - `ProfileHeader.tsx` - Update avatar upload
    - `MediaPreviewModal.tsx` - Add new upload trigger
5.  **Cleanup**: Remove duplicate or legacy upload implementations from other components.
6.  **Verification**: Add comprehensive tests for the new media upload service and update documentation.

## Module 2

### Issue 1: Type Drift & Unchecked `any` Across REST, Realtime, and Cache Updates

**Problem**: REST, WebSockets, and media types had drifted apart:

- REST messages supported images, audio, video, and documents, while the realtime socket payload declared only `"text"`.
- `MediaAssetResponseDto.type` only permitted `"image" | "audio"` instead of all supported media types.
- Message contracts lacked support for versioning, reactions, replies, and soft-deletion metadata.
- Extensive use of `any` in cache manipulation (`queryClient.setQueryData`) and mutation hooks obscured runtime inconsistencies.

**Fix**:

1. **Canonical Message Model**: Standardized `MessageCreatedEventPayload` in `src/types/realtime.ts` to alias `MessageResponseDto`, aligning WebSocket and REST contracts.
2. **Media Type Alignment**: Expanded `MediaAssetResponseDto.type` in `src/features/media/types/index.ts` to include `"image" | "audio" | "video" | "document"`.
3. **Contract Completeness**: Enriched `MessageResponseDto` in `src/features/chats/types/index.ts` with `reactions`, `replyToMessageId`, `version`, `deletedAt`, `updatedAt`, and `status: LocalMessageStatus` (`"pending" | "sent" | "failed"`).
4. **Strong Cache & Mutation Typing**: Eliminated `any` across `src/features/chats/hooks/optimisticHelpers.ts`, `useChatRealtime.ts`, `useMessageActions.ts`, and `useConversationActions.ts` by explicitly typing all cache stores with `InfiniteData<MessageHistoryResponseDto>` and `InfiniteData<ConversationListResponseDto>`.

---

### Issue 2: Server-Facing Settings Disconnected from Server State

**Problem**: The conversation notification toggle in `src/features/chats/screens/ProfileScreen.tsx` was implemented as isolated local state (`useState(true)`). It neither derived its initial state from the server's conversation mute configuration nor sent mute/unmute mutations to the backend.

**Fix**:

1. **Server-Derived State**: Derived `notificationsEnabled` directly from `conversationDetail.settings.muted` and `conversationDetail.settings.mutedUntil`.
2. **Action Dispatching**: Connected toggle changes to `useMuteConversation` (`duration: "always"`) and `useUnmuteConversation`.
3. **Optimistic Feedback & In-Flight Protection**: Bound `disabled` state to `muteMutation.isPending || unmuteMutation.isPending` to prevent mutation races.

---

### Issue 3: Form Defaults Fabricating User Data & Synchronous Effect State

**Problem**: In `src/features/settings/screens/EditProfileScreen.tsx`, initial state was populated from potentially undefined user profiles on cold boot, necessitating an anti-pattern `useEffect` that called `setState` synchronously. This triggered cascading renders and risked rendering or submitting placeholder data.

**Fix**:

1. **Derived Form State**: Implemented derived state (`nameInput ?? user?.displayName ?? ""`) to seamlessly track user modifications without needing synchronization effects.
2. **Read-Only Simplification**: Bound disabled fields (`phoneNumber`) directly to server profile data without unnecessary local state.
3. **Cascade Render Elimination**: Removed `useEffect` and `isNameDirty` flags, avoiding redundant render passes and visual flickers.

## Module 3

### Issue 1: Late Token Write After Logout (Session Invalidation)

**Problem**: In `src/services/api/client.ts`, when a 401 triggered a token refresh, the response handler saved tokens unconditionally via `tokenStorage.setTokens`. If a user logged out while refresh was in flight, the pending request's callback would write expired credentials back to SecureStore, resurrecting the previous session.

**Fix**:

1. **Session Generation Tracking**: Added monotonic `currentSessionGeneration` to `tokenStorage` in `src/services/api/token.ts`.
2. **Session Invalidation on Logout**: Bumping session generation in `useAuthStore.logout()` immediately invalidates all active refreshes and queued retry promises.
3. **Guard Against Late Writes**: In `client.ts`, verified `tokenStorage.getSessionGeneration() === sessionGeneration` before storing refreshed tokens and before fulfilling queued requests.
4. **Bounded Timeout**: Added a 10s request timeout to `/auth/refresh` to prevent hanging promises.
5. **Differentiated Failures**: Differentiated temporary network errors from credential rejections (401/403).

---

### Issue 2: Socket.IO Credential Drift & Server Disconnect Recovery

**Problem**: In `src/core/providers/RealtimeProvider.tsx`, the WebSocket captured an access token once when `isAuthenticated` became true. It never synchronized tokens when the HTTP layer rotated credentials, and server-forced authentication disconnects did not auto-reconnect.

**Fix**:

1. **Token Rotation Listener**: Subscribed to `tokenStorage.onTokenRefreshed` in `RealtimeProvider.tsx` to immediately update `socket.auth = { token }`.
2. **Explicit Server Disconnect Handling**: Handled `reason === "io server disconnect"` by pulling fresh credentials and explicitly invoking `socket.connect()`.
3. **Auth Error Recovery**: Handled `connect_error` by refreshing tokens and reconnecting.

---

### Issue 3: Cross-Account PIN Leaks & Biometric Security

**Problem**: Logging out normally did not reset the security store or wipe stored PIN data. Furthermore, the Face ID screen displayed a mock front-camera preview rather than authenticating against the operating system's biometric security provider.

**Fix**:

1. **Session Security Cleanup**: Updated `useAuthStore.logout()` to invoke `clearPinCode()` and `useSecurityStore.reset()`, guaranteeing that switching accounts never inherits another account's PIN or biometric unlock setting.
2. **Native Biometrics with `expo-local-authentication`**: Replaced the camera preview in `src/features/settings/screens/FaceIdScreen.tsx` with true hardware-backed biometric verification (`LocalAuthentication.authenticateAsync`).
3. **Biometric Unlock Integration**: Added biometric authentication to `src/app/unlock.tsx`, allowing users with enrolled Face ID / Fingerprints to unlock the app seamlessly.

---

### Issue 4: Dynamic Challenge OTP Length

**Problem**: The OTP verification challenge endpoint returns dynamic `codeLength` (e.g. 4 or 6 digits), but components hard-coded a length of 4 digits.

**Fix**:

1. **Propagated Challenge Metadata**: Extended `usePhoneStep`, `PhoneStep`, and `useRegisterFlow` to extract and carry `codeLength` from the `/auth/otp/request` response.
2. **Dynamic UI Rendering**: Updated `OtpStep` and `OtpInput` to render the exact number of input boxes specified by `codeLength`.
3. **Resend Synchronization**: Handled dynamic `codeLength` updates from `/auth/otp/resend` in `useOtpStep`.

---

### Cold Start PIN Flash Elimination & Privacy Screen Management

1. **Zero-Latency MMKV Synchronous Initialization**:
   - **Issue**: Zustand `persist` initializes with default state (`isPinSet: false`) and hydrates via an asynchronous microtask. Even with fast synchronous storage like MMKV, the initial React render saw `isPinSet === false`, causing `/(tabs)/chats` to mount and paint for a split second before redirecting to `/unlock`.
   - **Fix**: Initialized `useSecurityStore` and `useAuthStore` state synchronously from MMKV at store creation time in [useSecurityStore.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/store/useSecurityStore.ts) and [useAuthStore.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/store/useAuthStore.ts). Added synchronous lock guards in `Index`, `TabsLayout`, and `ChatsRoute`.
2. **Privacy Screen PIN Toggle & Management**:
   - Added an interactive **Security PIN** switch to [PrivacyScreen.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/settings/screens/PrivacyScreen.tsx).
   - When active (`isPinSet: true`), toggling OFF triggers a confirmation dialog to safely remove the PIN, erase credentials via `clearPinCode()`, and deactivate biometrics.
   - When inactive (`isPinSet: false`), toggling ON navigates directly to `/setup-pin`.
   - Prevented orphaned biometrics in `FaceIdScreen` by ensuring biometric activation requires an active Security PIN.
3. **PIN Prompt Single-Prompt Guarantee**:
   - Added `hasSeenPinPrompt` and `markPinPromptSeen()` to [useSecurityStore.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/store/useSecurityStore.ts) persisted in MMKV.
   - [TabsLayout](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/app/%28tabs%29/_layout.tsx) triggers `markPinPromptSeen()` on both "Yes" and "No, thanks", and setting up a PIN automatically marks the prompt as seen.
   - Removing the PIN on the Privacy Screen leaves `hasSeenPinPrompt: true` intact, ensuring the popup never re-appears unless the account is explicitly logged out.

## Module 4

### Issue 1: Reconnection Signals & React Query Foreground Reconciliation

**Problem**:

- `RealtimeProvider` incremented `reconcileVersion` on connection and `activityVersion` on activity, but these version counters were not consumed to trigger state reconciliation.
- Consequently, the main chat list was not refreshed upon reconnecting, and active chats failed to re-subscribe to presence or recover missed messages after network outages.
- Setting `refetchOnWindowFocus: true` in React Query defaults had no effect on mobile devices because React Native requires explicitly wiring `AppState` to TanStack Query's `focusManager`.

**Fix**:

1. **AppState Focus Integration**: In [queryClient.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/core/queryClient.ts), registered an `AppState` listener connected to `focusManager.setFocused(status === "active")`, enabling automatic query refetching when the app returns to the foreground.
2. **Foreground Socket Watchdog**: In [RealtimeProvider.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/core/providers/RealtimeProvider.tsx), added an `AppState` change listener that ensures disconnected sockets re-authenticate and reconnect immediately when foregrounded.
3. **Chat List Reconciliation**: In [ChatsScreen.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/screens/ChatsScreen.tsx), consumed both `activityVersion` and `reconcileVersion` from `useRealtime()` to invalidate `chatsKeys.list()`.
4. **Active Chat Reconnect & Missed Message Recovery**: In [useChatRealtime.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/hooks/useChatRealtime.ts), included `reconcileVersion` in the subscription effect dependency array. When the socket reconnects (`reconcileVersion > 0`), it automatically re-emits `presence.subscribe` to re-establish room presence and invalidates `chatsKeys.messages(conversationId)` to fetch any missed history.

---

### Issue 2: Broken Presence Self-Identification & Multi-User Group Typing

**Problem**:

- In [useChatRealtime.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/hooks/useChatRealtime.ts), `presence.subscribe` used `ack.data.participants.find(p => p.userId !== undefined)`, which grabbed the current user themselves when listed first, falsely marking the other participant as "Online".
- In group chats, presence and typing were collapsed into a single boolean. When User A stopped typing, `setIsOtherTyping(false)` was triggered, clearing the typing indicator even if User B was still actively typing.
- Typing indicators lacked timeout expiration, meaning if a user disconnected while typing, the typing state would persist indefinitely.

**Fix**:

1. **Online User Set & Self Exclusion**: Tracked presence using `onlineUserIds: Set<string>`. On `presence.subscribe` ack and `presence.changed`, filtered out `currentUserId`. Evaluated `isOtherOnline` dynamically (`onlineUserIds.has(targetUserId)` for direct chats, or `onlineUserIds.size > 0` for group chats).
2. **Multi-User Group Typing**: Replaced the single boolean with `typingUserIds: Set<string>`, allowing multiple group members to type simultaneously without interference.
3. **Typing Auto-Expiry**: Implemented a per-user 5-second auto-expiry timer using `typingTimeoutsRef`. When `typing.started` fires, a timer is scheduled to automatically remove the user if no `typing.stopped` event is received.
4. **Transient State Teardown**: Cleanly reset all typing timers, online sets, and typing sets when switching conversations or unmounting.

---

### Issue 3: Contact Matching Prepared for Real Address Books & Unblocked Global Search

**Problem**:

- [NewChatBottomSheet.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/components/NewChatBottomSheet.tsx), [NewGroupBottomSheet.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/components/NewGroupBottomSheet.tsx), and [AddMembersBottomSheet.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/components/AddMembersBottomSheet.tsx) duplicated contact discovery and matching.
- All device phone numbers were sent in a single unbatched, un-normalized request. The backend strictly requires international format and caps requests at **100 numbers per request**.
- If a user dismissed the bottom sheet while matching was in flight, late responses could write stale data to subsequent sessions.
- When contacts permission was denied, the UI blocked the entire results area, preventing users from executing global server user searches.

**Fix**:

1. **Unified Contact Discovery Hook**: Created [useContactDiscovery.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/hooks/useContactDiscovery.ts) using `expo-contacts/legacy`. It preloads device contacts when permissions are granted, displays local device contacts immediately, and executes backend phone matching in chunks of ≤ 100 with normalization and error isolation.
2. **Phone Normalization & Deduplication**: Normalizes numbers to E.164 (`normalizePhoneNumber`) and deduplicates via `Set<string>`.
3. **Chunking & Parallel Matching with Error Resilience**: Chunks phone numbers into batches of at most 100 (`BATCH_SIZE = 100`), executes `chatsApi.matchContacts` concurrently with `Promise.all`, and isolates errors so server issues never hide local device contacts.
4. **Unblocked Global Search**: Updated `NewChatBottomSheet`, `NewGroupBottomSheet`, and `AddMembersBottomSheet` so that permission denial only displays the fallback notice when the search query is empty (< 3 chars). Once the user types in the search box, global server search runs and displays results seamlessly without requiring address book access.

## Module 5

### Issue 1: Failure Handling & Durable Outbox / Retry Architecture

**Problem**:

- The message sending hook cleared composer text and attachments before media upload or API submission succeeded.
- If attachment upload or authorization failed, an error toast was shown but the composer remained empty and the attachment was lost.
- There was no explicit failed-message visual state or durable retry entry preserving the client message identity.

**Fix**:

1. **Durable Draft Persistence**: Implemented [useChatDraftsStore.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/store/useChatDraftsStore.ts) backed by MMKV. Composer text and attachments are retained across app restarts and switching conversations until successfully submitted.
2. **Durable Outbox Store**: Implemented [useChatOutboxStore.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/store/useChatOutboxStore.ts) backed by MMKV. Captures `clientMessageId`, `text`, `attachment`, `uploadedMediaId`, and `status: "pending" | "failed" | "sent"`.
3. **Non-Destructive Optimistic Pipeline**: In [useSendChatMessage.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/hooks/useSendChatMessage.ts), immediately adds the message into the query cache with `status: "pending"` and local attachment preview. If media upload fails, the optimistic entry transitions to `status: "failed"` instead of disappearing, keeping the user's content recoverable.
4. **Idempotent Retry**: Provided `handleRetryMessage(clientMessageId)` which reuses the exact same `clientMessageId` and cached `uploadedMediaId` (if already uploaded), guaranteeing server-side idempotency without duplicate messages.

---

### Issue 2: Isolated Send Failure (Preserving Unrelated Incoming Messages)

**Problem**:

- When message submission failed, `useSendMessage` `onError` restored `context.previousData` (the entire pre-mutation cache snapshot).
- If an unrelated incoming message arrived over WebSockets while the request was in flight, restoring the snapshot deleted that incoming message from the local cache.

**Fix**:

1. **Targeted Optimistic Mutation**: In [useConversationActions.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/hooks/useConversationActions.ts), removed the snapshot rollback in `onError`.
2. **Surgical Status Update**: `onError` targets only the message item where `item.clientMessageId === variables.clientMessageId`, setting its status to `"failed"`.
3. **Preserved Concurrent Messages**: All unrelated incoming and preceding messages in `oldData.pages` remain completely untouched and intact.

---

### Issue 3: End-to-End Read & Delivery State Integration

**Problem**:

- `ChatDetailScreen` marked the conversation read only upon initial mount, failing to advance read receipts as new messages arrived while the screen remained open.
- Receipt events only bumped an internal counter (`activityVersion`), and messages lacked a visual delivery status model.

**Fix**:

1. **Dynamic Read & Delivery Advancement**: In [ChatDetailScreen.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/screens/ChatDetailScreen.tsx), an effect monitors incoming messages from other participants. Whenever new messages arrive while the chat is open, it calls `markRead()`, `chatsApi.markReceiptRead`, and `chatsApi.markReceiptDelivered` through the latest message ID.
2. **Realtime Receipt Synchronization**: In [useChatRealtime.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/hooks/useChatRealtime.ts), subscribed to `receipt.delivered` and `receipt.read` events, updating `chatsKeys.receipts(conversationId)` query cache with monotonic version enforcement.
3. **Complete Delivery Status Presentation**:
   - Created `DeliveryStatus` (`"pending" | "sent" | "delivered" | "read" | "failed"`) in [MessagePill.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/components/MessagePill.tsx).
   - `pending`: clock icon.
   - `failed`: red exclamation icon with interactive **Retry** button.
   - `sent`: single gray checkmark (request accepted by server).
   - `delivered`: double gray checkmarks (delivered to recipient).
   - `read`: double sky-blue checkmarks (read by recipient).

---

### Issue 4: Chat-List Infinite Pagination, Search Filtering, and State Separation

**Problem**:

- [ChatsScreen.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/screens/ChatsScreen.tsx) held `searchQuery` state but never filtered displayed conversations.
- The conversation query supported pagination, but `fetchNextPage` was never wired to the list.
- Network errors during initial load displayed "No chats yet" rather than an actionable error state.

**Fix**:

1. **Client-Side Search Filtering**: Added memoized filtering in `ChatsScreen.tsx` matching `searchQuery` across participant display names, group names, and latest message previews.
2. **Infinite Pagination with LegendList**: Connected `onEndReached` to `fetchNextPage()` when `hasNextPage && !isFetchingNextPage && !searchQuery.trim()`, and added `ListFooterComponent` displaying an activity indicator during pagination fetches.
3. **Separated UI States**:
   - **Loading State**: Full-height loading spinner with informative text.
   - **Error State**: Displays error message and a dedicated **Retry** button wired to `refetch()`.
   - **Search Empty State**: Displays `No chats found matching "{searchQuery}"`.
   - **Empty State**: Displays `No chats yet` with prompt to start a conversation.

---

## Module 6 — Media and Permissions

### Issue 1: Onboarding Avatar Contract Compliance & Lifecycle State Machine

**Problem**:
- In [ProfileStep.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/auth/components/ProfileStep.tsx), as soon as a user picked a photo locally, the screen displayed "Done! Your photo successfully uploaded" with a green checkmark before any network transfer took place.
- The onboarding flow previously extracted `secureUrl` and attempted to assign it via `PATCH /me { avatarUrl }`, violating the backend schema which strictly restricts `PATCH /me` to `displayName` and requires `PUT /me/avatar { mediaId }`.
- [useProfileStep.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/auth/hooks/useProfileStep.ts) discarded file metadata (`fileName`, `mimeType`, `fileSize`) upon picking.

**Fix**:
1. **Avatar Stage State Machine**: Introduced explicit `avatarStage` (`"idle" | "selected" | "uploading" | "verified" | "saved" | "failed"`) in `useProfileStep.ts`.
2. **Metadata Preservation**: Captured full file information (`uri`, `fileName`, `mimeType`, `fileSize`) on selection from `ImagePicker` and validated that the file does not exceed the 50 MB threshold.
3. **Accurate UI Representation**: In `ProfileStep.tsx`, replaced premature success indicators with truthful state-driven labels ("Photo selected", "Uploading photo...", "Saving profile..."), an interactive remove/change photo button, and responsive button titles.
4. **Strict API Contract Conformance**: In `finishRegistration`, sequentially:
   - Uploads via shared `uploadMedia` passing verified metadata.
   - Assigns avatar via `setAvatarMutation.mutateAsync({ mediaId: mediaAsset.id })` (`PUT /me/avatar`).
   - Updates `displayName` via `updateProfile({ displayName })` (`PATCH /me`).
   - On error, transitions to `"failed"` with toast feedback so users can retry without losing their selected image.

---

### Issue 2: File Metadata Normalization, iOS `ph://` Resolution & Document Allowlist

**Problem**:
- Media uploads defaulted to a fabricated `500000` byte size and guessed MIME types from basic URI endings.
- In [AttachmentPickerMenu.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/components/AttachmentPickerMenu.tsx), iOS device photos from `expo-media-library` had `ph://` URIs rather than upload-ready local paths, causing multipart upload failures.
- Camera and recent-photo callbacks forwarded only a string URI, dropping filenames, MIME types, and byte sizes.
- Document selection used `type: "*/*"` with no client-side restriction against unsupported files.

**Fix**:
1. **Upload Service Validation**: In [uploadService.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/media/services/uploadService.ts), added pre-upload validation against `VALID_MEDIA_CONTENT_TYPES` and enforced a strict 50 MiB limit (`MAX_MEDIA_SIZE_BYTES = 52428800`). Eliminated arbitrary placeholder sizes in favor of actual byte sizes (falling back to a minimal 1024 bytes if unknown). Added `signal?: AbortSignal` cancellation support.
2. **iOS `ph://` Resolution**: In `AttachmentPickerMenu.tsx`, when selecting an asset with `uri.startsWith("ph://")`, invoked `MediaLibrary.getAssetInfoAsync(asset.id)` to obtain the upload-ready `assetInfo.localUri`.
3. **Rich Metadata Forwarding**: Updated `onSelectPhotoUri` to carry `(uri, fileName, mimeType, fileSize)` and wired camera captures to forward actual sizes and MIME types.
4. **Strict Document Allowlist**: In [ChatDetailScreen.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/screens/ChatDetailScreen.tsx), restricted `DocumentPicker.getDocumentAsync` to supported formats: PDF, TXT, DOC, DOCX, XLSX, and PPTX. Added pre-upload size guards (`<= 50 MB`) for both image and document pickers.

---

### Issue 3: Upload Recovery, Stage-Specific Retry & Outbox Deduplication

**Problem**:
- In [useSendChatMessage.ts](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/hooks/useSendChatMessage.ts), optimistic messages unconditionally set `kind: "image"` and attachment `type: "image"`, misrepresenting documents.
- If media authorization returned an already-ready response (`upload: null` for deduplicated files), `uploadMedia` previously risked losing the media reference.
- Sending retries risked re-uploading media that had already completed successfully.

**Fix**:
1. **Deduplication Resilience**: `uploadMedia` returns `uploadAuth.media` directly when `uploadAuth.upload` is `null`, ensuring ready media IDs are preserved without superfluous uploads.
2. **Stage-Specific Retry**: In `useSendChatMessage.ts`, `handleRetryMessage` checks `entry.uploadedMediaId`. If media transfer already succeeded in a prior attempt, retry skips re-uploading and immediately re-submits the message using the exact same `clientMessageId`.
3. **Kind & Type Discrimination**: Optimistic messages evaluate attachment extensions and MIME types to assign `kind: "document" | "image"` and attachment `type: "document" | "image"`, preserving `originalFilename`.

---

### Issue 4: Dynamic Attachment Rendering by Media Type & Live Shared Media

**Problem**:
- [MessagePill.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/components/MessagePill.tsx) rendered every attachment with `<Image>`, resulting in broken UI for non-image files (PDFs, audio, video).
- [ProfileScreen.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/screens/ProfileScreen.tsx) and [ChatMediaScreen.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/screens/ChatMediaScreen.tsx) relied on hardcoded `DUMMY_PHOTOS` instead of displaying real media shared in the conversation.

**Fix**:
1. **Dynamic Attachment Item**: Created `AttachmentItem` in `MessagePill.tsx` with dedicated renderers:
   - **Documents**: Interactive document card with file icon (color-coded for PDFs vs other documents), file name, human-readable size (`formatAttachmentSize`), and tap-to-open action via `Linking.openURL`.
   - **Images**: Rounded image container with tap-to-open.
   - **Videos**: Dark card with duration, filename, and play overlay.
   - **Audio**: Audio pill with waveform icon, filename, and size.
2. **Real Conversation Media Integration**:
   - In `ProfileScreen.tsx`, connected `useConversationMessages(conversationId)` to extract actual image attachments from conversation history. Passed real photos and count to `MediaSummaryRows`, falling back gracefully to dummy data only if the conversation has no photos yet.
   - In [MediaSummaryRows.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/components/MediaSummaryRows.tsx), supported both URL strings and attachment objects (`photo.url || photo.uri || photo`).
   - In `ChatMediaScreen.tsx`, connected message history to `MediaPhotosTab` and added a clean empty state in [MediaPhotosTab.tsx](file:///c:/Users/gabri/Documents/Rise/rise-chat/src/features/chats/components/MediaPhotosTab.tsx).
