# Authentication & Route Guarding Flow

This document outlines the control flow for reauthentication (token refresh) and the global route guard in the Rise Chat application.

## 1. Reauthentication Logic (Axios Interceptors)

The application uses **JSON Web Tokens (JWT)**. Access tokens are short-lived, while refresh tokens are long-lived. To provide a seamless user experience, the application automatically refreshes access tokens in the background without interrupting the user.

**Location:** `src/services/api/client.ts`

### Control Flow
1. **Request Interception:** Every outgoing request passes through the Axios request interceptor. It fetches the current access token from `tokenStorage` (`expo-secure-store`) and attaches it to the `Authorization: Bearer <token>` header.
2. **401 Unauthorized Response:** If the backend rejects a request because the access token is expired, the response interceptor catches the `401 Unauthorized` error.
3. **Queueing Mechanism:** 
   - A lock (`isRefreshing`) is engaged to ensure only one refresh request happens at a time.
   - Any other incoming requests that also fail with 401 are temporarily paused and pushed into a `failedQueue`.
4. **Token Refresh API Call:** The client makes a raw `axios.post` call to `/auth/refresh` using the stored refresh token.
5. **Success Handling:**
   - The new Access and Refresh tokens are saved back into the encrypted `tokenStorage`.
   - The queue is processed (`processQueue`), and all paused requests are re-run with the new access token.
   - The original request that failed is also re-run and returned to the user seamlessly.
6. **Failure Handling (Force Logout):**
   - If the refresh request fails (e.g., the refresh token is expired or revoked), the queue is rejected.
   - The client dynamically imports `useAuthStore` and executes `useAuthStore.getState().logout()`.
   - This explicitly sets the global user state to `null`.

---

## 2. Global Route Guarding

Because React Native lacks traditional server-side routing, route protection is enforced entirely on the client side using an asynchronous listener that watches the user's state and current URL path.

**Location:** `src/shared/hooks/useProtectedRoute.ts` and `src/app/_layout.tsx`

### Architecture
- **Synchronous Storage:** User authentication state (`useAuthStore`) is persisted using **React Native MMKV**. Because MMKV is entirely synchronous (via JSI), the application knows if the user is authenticated the exact millisecond the JavaScript engine boots up, avoiding splash screen delays.
- **Global Listener:** `useProtectedRoute` is mounted at the absolute root of the application (`_layout.tsx`) and watches `useAuthStore.user`, `segments` (the current URL), and `useAppStore.hasSeenOnboarding`.

### Control Flow Rules

The guard evaluates routing logic on every state or path change:

1. **Fully Authenticated Users:**
   - *Condition:* `user` exists AND `profileComplete` (or `displayName`) is truthy.
   - *Action:* If they attempt to access `/(auth)` routes or `/welcome`, they are instantly redirected to `/(tabs)/chats`.
2. **Incomplete Profile Users:**
   - *Condition:* `user` exists, but they have not completed their profile setup.
   - *Action:* If they attempt to access anything outside of the `/(auth)` group (like `/(tabs)`), they are redirected to `/(auth)/register` to finish setting up their name/avatar.
3. **Unauthenticated Users:**
   - *Condition:* `user` is `null`.
   - *Action:* If they attempt to access any protected route in the `/(tabs)` group, the guard checks `hasSeenOnboarding`:
     - If `true`: Redirects directly to `/(auth)/register` (skipping the welcome screen).
     - If `false`: Redirects to `/welcome`.

### Intercepting the 401 Logout
When the API client (from section 1) forces a logout by setting `user = null`, the `useProtectedRoute` listener instantly catches the state change. Because the user is now unauthenticated while sitting on a `/(tabs)` route, rule #3 is triggered, forcibly kicking the user out to the authentication screens without requiring any extra UI logic.
