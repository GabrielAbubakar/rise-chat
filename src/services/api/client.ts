import { env } from "@/core/config/env";
import { AppError } from "@/shared/utils";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./token";

export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh token requests at once
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
  sessionGeneration: number;
}[] = [];

const processQueue = (
  error: any,
  token: string | null = null,
  currentSession: number,
) => {
  failedQueue.forEach((prom) => {
    if (prom.sessionGeneration !== currentSession) {
      prom.reject(new Error("Session expired/logged out while queued"));
    } else if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle global errors, token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized errors for token refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const sessionGeneration = tokenStorage.getSessionGeneration();

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject, sessionGeneration });
        })
          .then((token) => {
            if (tokenStorage.getSessionGeneration() !== sessionGeneration) {
              return Promise.reject(
                new Error("Session invalidated while waiting for refresh"),
              );
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = "Bearer " + token;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.log(
        `⏳ [Auth Module] Attempting token refresh (session: ${sessionGeneration})...`,
      );

      try {
        const refreshToken = await tokenStorage.getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Bounded 10s request timeout to avoid indefinitely hanging requests
        const { data } = await axios.post(
          `${env.API_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 10000 },
        );

        // Guard against late writes: check if user logged out or session rotated during refresh
        if (tokenStorage.getSessionGeneration() !== sessionGeneration) {
          console.log(
            "🛑 [Auth Module] Session invalidated during refresh; discarding returned tokens.",
          );
          processQueue(
            new Error("Session invalidated during refresh"),
            null,
            sessionGeneration,
          );
          return Promise.reject(
            new Error("Session invalidated during refresh"),
          );
        }

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        await tokenStorage.setTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        console.log("✨ [Auth Module] Token refreshed successfully");
        processQueue(null, newAccessToken, sessionGeneration);

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.log(
          "🚨 [Auth Module] Token refresh failed:",
          refreshError?.message,
        );
        processQueue(refreshError, null, sessionGeneration);

        // Distinguish network/timeout failure from rejected credentials
        const isAuthRejection =
          refreshError.response?.status === 401 ||
          refreshError.response?.status === 403 ||
          !refreshError.response;

        if (
          isAuthRejection &&
          tokenStorage.getSessionGeneration() === sessionGeneration
        ) {
          const { useAuthStore } = await import("@/store/useAuthStore");
          await useAuthStore.getState().logout();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Map the error to our standard AppError
    const data = error.response?.data as any;
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join("; ")
      : rawMessage || error.message || "An unexpected error occurred";
    const code = data?.code || data?.error || error.code || "API_ERROR";
    const appError = new AppError(message, code, error.response?.status);

    return Promise.reject(appError);
  },
);
