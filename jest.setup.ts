import "@testing-library/react-native/dist/matchers/extend-expect";

// Set fallback environment variables for tests
process.env.EXPO_PUBLIC_API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.example.com/v1";
process.env.EXPO_PUBLIC_WS_URL =
  process.env.EXPO_PUBLIC_WS_URL || "wss://api.example.com/chat";

// react-native-worklets mock
jest.mock("react-native-worklets", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("react-native-worklets/src/mock")
);

// react-native-reanimated mock
jest.mock("react-native-reanimated", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("react-native-reanimated/mock")
);

// react-native-mmkv mock
jest.mock("react-native-mmkv", () => {
  const store = new Map<string, any>();
  const mockInstance = {
    set: jest.fn((key: string, value: any) => store.set(key, value)),
    getString: jest.fn((key: string) => store.get(key) ?? undefined),
    getNumber: jest.fn((key: string) => store.get(key) ?? undefined),
    getBoolean: jest.fn((key: string) => store.get(key) ?? undefined),
    delete: jest.fn((key: string) => store.delete(key)),
    remove: jest.fn((key: string) => store.delete(key)),
    clearAll: jest.fn(() => store.clear()),
    getAllKeys: jest.fn(() => Array.from(store.keys())),
    contains: jest.fn((key: string) => store.has(key)),
  };
  return {
    createMMKV: jest.fn(() => mockInstance),
    MMKV: jest.fn().mockImplementation(() => mockInstance),
  };
});

// react-native-keyboard-controller mock
jest.mock("react-native-keyboard-controller", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return {
    KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
    KeyboardAvoidingView: View,
    useKeyboardHandler: jest.fn(),
    useReanimatedFocusedInput: jest.fn(() => ({ input: { value: {} } })),
    useResizeMode: jest.fn(),
  };
});

// @shopify/react-native-skia mock
jest.mock("@shopify/react-native-skia", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return {
    Canvas: View,
    Fill: View,
    Group: View,
    Rect: View,
    Circle: View,
    Path: View,
    Text: View,
    Skia: {
      Paint: () => ({}),
      Path: {
        Make: () => ({}),
      },
      Color: () => ({}),
    },
  };
});
