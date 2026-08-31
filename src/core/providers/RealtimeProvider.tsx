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
import type { ChatSocket } from "../api/protocol";

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
  const user = useAuthStore((state) => state.user);
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");
  const [activityVersion, setActivityVersion] = useState(0);
  const [reconcileVersion, setReconcileVersion] = useState(0);

  useEffect(() => {
    let active = true;

    if (!enabled || !user) {
      setSocket(null);
      setStatus("disconnected");
      return;
    }

    // Connect to Socket.IO only after fetching the token securely
    tokenStorage.getAccessToken().then((token) => {
      if (!active || !token) {
        setStatus("disconnected");
        return;
      }

      const socketUrl = env.EXPO_PUBLIC_WS_URL;

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

      const onConnect = () => {
        setStatus("connected");
        setReconcileVersion((value) => value + 1);
      };

      const onDisconnect = (reason: string) => {
        setStatus("disconnected");
      };

      const onReconnectAttempt = () => setStatus("reconnecting");

      const onConnectError = (error: Error & { data?: { code?: string } }) => {
        setStatus("disconnected");
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
    });

    return () => {
      active = false;
      setSocket((current) => {
        if (current) {
          current.removeAllListeners();
          current.io.removeAllListeners();
          current.disconnect();
        }
        return null;
      });
    };
  }, [enabled, user]);

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
