import { env } from "@/core/config/env";
import { tokenStorage } from "@/services/api/token";
import { useAuthStore } from "@/store/useAuthStore";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { io } from "socket.io-client";
import type { ChatSocket } from "@/types/realtime";

export type RealtimeStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface RealtimeContextValue {
  socket: ChatSocket | null;
  status: RealtimeStatus;
  activityVersion: number;
  reconcileVersion: number;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface RealtimeProviderProps extends PropsWithChildren {
  enabled?: boolean;
}

export function RealtimeProvider({
  children,
  enabled = true,
}: RealtimeProviderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");
  const [activityVersion, setActivityVersion] = useState(0);
  const [reconcileVersion, setReconcileVersion] = useState(0);

  useEffect(() => {
    let active = true;

    if (!enabled || !isAuthenticated) {
      return;
    }

    // Connect to Socket.IO only after fetching the token securely
    tokenStorage.getAccessToken().then((token) => {
      if (!active || !token) {
        setStatus("disconnected");
        return;
      }

      const socketUrl = env.EXPO_PUBLIC_WS_URL;
      console.log("🔌 [Realtime] Initializing socket connection to:", socketUrl);

      const next = io(socketUrl, {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        timeout: 15000,
        transports: ["websocket"],
      }) as ChatSocket;

      setSocket(next);
      setStatus("connecting");

      // Subscribe to HTTP token rotation events to keep socket credentials in sync
      const unsubscribeTokenRefresh = tokenStorage.onTokenRefreshed(
        (newToken) => {
          if (!active || !next) return;
          console.log("🔄 [Realtime] Syncing rotated access token to socket auth");
          next.auth = { token: newToken };
          if (!next.connected) {
            next.connect();
          }
        },
      );

      const onConnect = () => {
        console.log("⚡ [Realtime] Connected to socket server successfully. Socket ID:", next.id);
        setStatus("connected");
        setReconcileVersion((value) => value + 1);
      };

      const onDisconnect = async (reason: string) => {
        console.log("🔌 [Realtime] Disconnected:", reason);
        setStatus("disconnected");

        // The backend disconnects sockets when access tokens expire.
        // Socket.IO does not auto-reconnect on server-initiated disconnects; reconnect explicitly.
        if (reason === "io server disconnect" && active) {
          try {
            console.log("🔄 [Realtime] Re-authenticating after server disconnect...");
            const currentToken = await tokenStorage.getAccessToken();
            if (currentToken && next) {
              next.auth = { token: currentToken };
              next.connect();
            }
          } catch (e) {
            console.error("Failed to reconnect after server disconnect", e);
          }
        }
      };

      const onReconnectAttempt = async (attempt: number) => {
        console.log(`🔄 [Realtime] Reconnecting to socket (attempt ${attempt})...`);
        setStatus("reconnecting");
        const currentToken = await tokenStorage.getAccessToken();
        if (currentToken && next) {
          next.auth = { token: currentToken };
        }
      };

      const onConnectError = async (
        error: Error & { data?: { code?: string } },
      ) => {
        console.log("🔌 [Realtime] Connect error:", error.message, error.data);
        setStatus("disconnected");

        const isAuthError =
          error.message?.toLowerCase().includes("auth") ||
          error.message?.toLowerCase().includes("token") ||
          error.data?.code === "AUTH_ACCESS_TOKEN_INVALID";

        if (isAuthError && active) {
          try {
            console.log("🔄 [Realtime] Refreshing credentials after auth connect error...");
            const currentToken = await tokenStorage.getAccessToken();
            if (currentToken && next) {
              next.auth = { token: currentToken };
              next.connect();
            }
          } catch (e) {
            console.error("Failed to recover socket connection on auth error", e);
          }
        }
      };

      const bumpActivity = () => setActivityVersion((value) => value + 1);

      next.on("connect", onConnect);
      next.on("disconnect", onDisconnect);
      next.on("connect_error", onConnectError);
      next.io.on("reconnect_attempt", onReconnectAttempt);

      // Keep track of general activity
      next.on("message.created", bumpActivity);
      next.on("receipt.delivered", bumpActivity);
      next.on("receipt.read", bumpActivity);

      return () => {
        unsubscribeTokenRefresh();
      };
    });

    return () => {
      active = false;
      setSocket((current) => {
        if (current) {
          console.log("🔌 [Realtime] Closing socket connection (unmount/logout)");
          current.removeAllListeners();
          current.io.removeAllListeners();
          current.disconnect();
        }
        return null;
      });
    };
  }, [enabled, isAuthenticated]);

  const value = useMemo<RealtimeContextValue>(
    () => ({ socket, status, activityVersion, reconcileVersion }),
    [activityVersion, reconcileVersion, socket, status],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const value = useContext(RealtimeContext);
  if (!value) {
    throw new Error("useRealtime must be used inside RealtimeProvider.");
  }
  return value;
}
