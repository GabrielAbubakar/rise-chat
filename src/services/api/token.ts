import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'rise_chat_access_token';
const REFRESH_TOKEN_KEY = 'rise_chat_refresh_token';

export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token) console.log('🔑 [Auth Module] Access token found');
      return token;
    } catch (e) {
      console.error('Error getting access token', e);
      return null;
    }
  },
  
  setAccessToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (e) {
      console.error('Error setting access token', e);
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (token) console.log('🔄 [Auth Module] Refresh token found');
      return token;
    } catch (e) {
      console.error('Error getting refresh token', e);
      return null;
    }
  },
  
  setRefreshToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (e) {
      console.error('Error setting refresh token', e);
    }
  },

  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    await Promise.all([
      tokenStorage.setAccessToken(accessToken),
      tokenStorage.setRefreshToken(refreshToken),
    ]);
    console.log('💾 [Auth Module] Tokens saved successfully');
  },

  clearTokens: async (): Promise<void> => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
      console.log('🗑️ [Auth Module] Tokens cleared from secure storage');
    } catch (e) {
      console.error('Error clearing tokens', e);
    }
  },
};
