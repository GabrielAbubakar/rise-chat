import { apiClient } from "@/services/api/client";
import { tokenStorage } from "@/services/api/token";
import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";

// Mock axios.post for refresh endpoint
jest.mock("axios", () => {
  const actualAxios = jest.requireActual("axios");
  const mockInstance = actualAxios.create();
  return {
    ...actualAxios,
    create: jest.fn(() => mockInstance),
    post: jest.fn(),
  };
});

describe("F5 & F6 Regression: Request Session Stamping & Network Error Handling", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: true });
    await tokenStorage.setTokens("test-access-token", "test-refresh-token");
  });

  describe("F5: Request Session Stamping & Stale 401 Rejection", () => {
    it("stamps the active session generation on outgoing request config", async () => {
      const currentGen = tokenStorage.getSessionGeneration();
      const config = await (apiClient.interceptors.request as any).handlers[0].fulfilled({
        headers: {},
      });

      expect(config._sessionGeneration).toBe(currentGen);
      expect(config.headers.Authorization).toBe("Bearer test-access-token");
    });

    it("drops a delayed 401 from an earlier session without refreshing tokens or replaying", async () => {
      const initialGen = tokenStorage.getSessionGeneration();

      // Request initiated in session 1
      const staleRequestConfig = {
        _sessionGeneration: initialGen,
        headers: { Authorization: "Bearer old-token" },
      };

      // User A logs out / switches to User B (session generation increments to 2)
      tokenStorage.incrementSessionGeneration();
      const newGen = tokenStorage.getSessionGeneration();
      expect(newGen).toBeGreaterThan(initialGen);

      // User A's delayed 401 arrives in session 2
      const error401 = {
        response: { status: 401 },
        config: staleRequestConfig,
      };

      const responseErrorHandler = (apiClient.interceptors.response as any).handlers[0].rejected;

      await expect(responseErrorHandler(error401)).rejects.toThrow(
        "Stale request from previous session dropped",
      );

      // Verify that auth refresh was NOT called for User B
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe("F6: Distinguish Network Failures from Genuine Auth Revocation", () => {
    it("preserves session and does NOT log out when refresh encounters a network drop (no response)", async () => {
      const currentGen = tokenStorage.getSessionGeneration();
      const requestConfig = {
        _sessionGeneration: currentGen,
        headers: {},
      };

      // Mock refresh failure: network error (no response)
      (axios.post as jest.Mock).mockRejectedValueOnce(
        new Error("Network Error"), // has no .response property
      );

      const logoutSpy = jest.spyOn(useAuthStore.getState(), "logout");
      const responseErrorHandler = (apiClient.interceptors.response as any).handlers[0].rejected;

      const error401 = {
        response: { status: 401 },
        config: requestConfig,
      };

      await expect(responseErrorHandler(error401)).rejects.toThrow("Network Error");

      // Verify user was NOT logged out
      expect(logoutSpy).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("preserves session and does NOT log out when refresh encounters a timeout (ECONNABORTED)", async () => {
      const currentGen = tokenStorage.getSessionGeneration();
      const requestConfig = {
        _sessionGeneration: currentGen,
        headers: {},
      };

      const timeoutError: any = new Error("timeout of 10000ms exceeded");
      timeoutError.code = "ECONNABORTED";
      (axios.post as jest.Mock).mockRejectedValueOnce(timeoutError);

      const logoutSpy = jest.spyOn(useAuthStore.getState(), "logout");
      const responseErrorHandler = (apiClient.interceptors.response as any).handlers[0].rejected;

      await expect(
        responseErrorHandler({
          response: { status: 401 },
          config: requestConfig,
        }),
      ).rejects.toThrow("timeout of 10000ms exceeded");

      expect(logoutSpy).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("preserves session and does NOT log out when refresh receives a 500 server error", async () => {
      const currentGen = tokenStorage.getSessionGeneration();
      const requestConfig = {
        _sessionGeneration: currentGen,
        headers: {},
      };

      const serverError: any = new Error("Internal Server Error");
      serverError.response = { status: 500 };
      (axios.post as jest.Mock).mockRejectedValueOnce(serverError);

      const logoutSpy = jest.spyOn(useAuthStore.getState(), "logout");
      const responseErrorHandler = (apiClient.interceptors.response as any).handlers[0].rejected;

      await expect(
        responseErrorHandler({
          response: { status: 401 },
          config: requestConfig,
        }),
      ).rejects.toThrow("Internal Server Error");

      expect(logoutSpy).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("logs out immediately when refresh fails with genuine 401 invalid refresh token", async () => {
      const currentGen = tokenStorage.getSessionGeneration();
      const requestConfig = {
        _sessionGeneration: currentGen,
        headers: {},
      };

      const authRejectionError: any = new Error("Unauthorized");
      authRejectionError.response = { status: 401 };
      (axios.post as jest.Mock).mockRejectedValueOnce(authRejectionError);

      const logoutSpy = jest.spyOn(useAuthStore.getState(), "logout");
      const responseErrorHandler = (apiClient.interceptors.response as any).handlers[0].rejected;

      await expect(
        responseErrorHandler({
          response: { status: 401 },
          config: requestConfig,
        }),
      ).rejects.toThrow("Unauthorized");

      // Verify user WAS logged out
      expect(logoutSpy).toHaveBeenCalled();
    });
  });
});

