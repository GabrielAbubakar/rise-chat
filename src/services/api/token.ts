import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "rise_chat_access_token";
const REFRESH_TOKEN_KEY = "rise_chat_refresh_token";

// Synchronous in-memory token cache to prevent async storage race conditions
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let isInitialized = false;

export const tokenStorage = {
  // Initialize in-memory cache from SecureStore on startup
  init: async (): Promise<void> => {
    if (isInitialized) return;
    try {
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);
      memoryAccessToken = access;
      memoryRefreshToken = refresh;
    } catch (e) {
      console.error("Error initializing tokenStorage", e);
    } finally {
      isInitialized = true;
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    if (memoryAccessToken !== null) return memoryAccessToken;
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      memoryAccessToken = token;
      return token;
    } catch (e) {
      console.error("Error getting access token", e);
      return null;
    }
  },

  setAccessToken: async (token: string): Promise<void> => {
    memoryAccessToken = token;
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (e) {
      console.error("Error setting access token", e);
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    if (memoryRefreshToken !== null) return memoryRefreshToken;
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      memoryRefreshToken = token;
      return token;
    } catch (e) {
      console.error("Error getting refresh token", e);
      return null;
    }
  },

  setRefreshToken: async (token: string): Promise<void> => {
    memoryRefreshToken = token;
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (e) {
      console.error("Error setting refresh token", e);
    }
  },

  setTokens: async (
    accessToken: string,
    refreshToken: string,
  ): Promise<void> => {
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;
    try {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      ]);
      console.log("💾 [Auth Module] Tokens saved successfully in memory & secure storage");
    } catch (e) {
      console.error("Error setting tokens", e);
    }
  },

  clearTokens: async (): Promise<void> => {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
      console.log("🗑️ [Auth Module] Tokens cleared from memory & secure storage");
    } catch (e) {
      console.error("Error clearing tokens", e);
    }
  },
};
