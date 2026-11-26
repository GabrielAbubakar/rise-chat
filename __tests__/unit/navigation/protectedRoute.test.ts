import { renderHook } from "@testing-library/react-native";
import { useProtectedRoute } from "@/shared/hooks/useProtectedRoute";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store";
import { useSecurityStore } from "@/store/useSecurityStore";
import * as expoRouter from "expo-router";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(),
  usePathname: jest.fn(),
  useGlobalSearchParams: jest.fn(),
}));

jest.mock("@/features/settings/hooks/useProfile", () => ({
  useGetMe: jest.fn().mockReturnValue({
    data: { id: "user-1", displayName: "Tester", profileComplete: true },
  }),
}));

describe("useProtectedRoute - F10 Concrete Parameter Preservation", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (expoRouter.useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    useAppStore.setState({ pendingRoute: null, hasSeenOnboarding: true });
    useAuthStore.setState({ isAuthenticated: false });
    useSecurityStore.setState({ isPinSet: false, isAppUnlocked: false });
  });

  it("preserves concrete route and query parameters instead of dynamic placeholders when unauthenticated", async () => {
    (expoRouter.useSegments as jest.Mock).mockReturnValue(["chat", "[id]"]);
    (expoRouter.usePathname as jest.Mock).mockReturnValue("/chat/conv-alpha-789");
    (expoRouter.useGlobalSearchParams as jest.Mock).mockReturnValue({
      id: "conv-alpha-789",
      search: "crypto",
    });

    await renderHook(() => useProtectedRoute(true));

    expect(useAppStore.getState().pendingRoute).toBe(
      "/chat/conv-alpha-789?search=crypto",
    );
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/register");
  });

  it("preserves concrete route and query parameters when app is PIN-locked", async () => {
    useAuthStore.setState({ isAuthenticated: true });
    useSecurityStore.setState({ isPinSet: true, isAppUnlocked: false });

    (expoRouter.useSegments as jest.Mock).mockReturnValue(["chat", "[id]"]);
    (expoRouter.usePathname as jest.Mock).mockReturnValue("/chat/conv-secure-456");
    (expoRouter.useGlobalSearchParams as jest.Mock).mockReturnValue({
      id: "conv-secure-456",
    });

    await renderHook(() => useProtectedRoute(true));

    expect(useAppStore.getState().pendingRoute).toBe("/chat/conv-secure-456");
    expect(mockReplace).toHaveBeenCalledWith("/unlock");
  });

  it("consumes concrete destination and clears pendingRoute after unlocking or completing profile", async () => {
    useAuthStore.setState({ isAuthenticated: true });
    useSecurityStore.setState({ isPinSet: true, isAppUnlocked: true });
    useAppStore.setState({ pendingRoute: "/chat/conv-saved-123?tab=media" });

    (expoRouter.useSegments as jest.Mock).mockReturnValue(["unlock"]);
    (expoRouter.usePathname as jest.Mock).mockReturnValue("/unlock");
    (expoRouter.useGlobalSearchParams as jest.Mock).mockReturnValue({});

    await renderHook(() => useProtectedRoute(true));

    expect(mockReplace).toHaveBeenCalledWith("/chat/conv-saved-123?tab=media");
    expect(useAppStore.getState().pendingRoute).toBeNull();
  });

  it("safely discards legacy unresolved placeholder destination and defaults to tabs/chats", async () => {
    useAuthStore.setState({ isAuthenticated: true });
    useSecurityStore.setState({ isPinSet: false, isAppUnlocked: true });
    useAppStore.setState({ pendingRoute: "/chat/[id]" });

    (expoRouter.useSegments as jest.Mock).mockReturnValue(["(auth)", "login"]);
    (expoRouter.usePathname as jest.Mock).mockReturnValue("/(auth)/login");
    (expoRouter.useGlobalSearchParams as jest.Mock).mockReturnValue({});

    await renderHook(() => useProtectedRoute(true));

    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/chats");
    expect(useAppStore.getState().pendingRoute).toBeNull();
  });
});
