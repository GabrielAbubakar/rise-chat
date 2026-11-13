# Rise Chat

Rise Chat is a modern, high-performance messaging and calling mobile application built with **Expo SDK 57**, **React Native 0.86**, and **React 19**. It features real-time chat, WebRTC voice/video calls, media sharing, biometric app lock, and dynamic theming.

---

## Highlights & Features

- **Real-Time Messaging**: Real-time communication via WebSockets (Socket.io), featuring active presence status, typing indicators, read receipts, and message history.
- **Voice & Video Calling**: Peer-to-peer audio and video calls powered by WebRTC (`react-native-webrtc`).
- **Rich Media & Sharing**:
  - Voice notes with audio recording and playback (`expo-audio`).
  - Photos and videos with in-app camera capture (`expo-camera`) and media library picking (`expo-image-picker`).
  - Document attachments (`expo-document-picker`) and file sharing (`expo-sharing`).
  - QR Code contact sharing and scanning (`react-native-qrcode-svg`).
- **Security & Privacy**:
  - Biometric authentication (Face ID / Fingerprint / Touch ID) via `expo-local-authentication`.
  - Inactivity App Lock and secure passcode support.
  - Encrypted credential and token storage with `expo-secure-store`.
- **Customization & Theming**:
  - Adaptive Day/Night modes (Light, Dark, System).
  - Dynamic accent color palette switching (Green, Blue, Purple, Orange, etc.).
  - Dynamic App Icon switching on iOS and Android (`@variant-systems/expo-dynamic-app-icon`).
- **Performance & Smooth UI**:
  - Built with NativeWind v4 (TailwindCSS) and Tailwind Variants.
  - 60+ FPS gestures and micro-interactions with React Native Reanimated v4.
  - Interactive bottom sheets (`@gorhom/bottom-sheet`) and optimized high-scale list rendering (`@legendapp/list`).
  - Smooth interactive keyboard handling with `react-native-keyboard-controller`.

---

## Tech Stack



| Layer                     | Technologies                                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**             | [Expo SDK 57](https://docs.expo.dev/) & [React Native 0.86](https://reactnative.dev/)                                                                                               |
| **Language**              | TypeScript (~6.0)                                                                                                                                                                   |
| **Routing**               | [Expo Router v57](https://docs.expo.dev/router/introduction/) (File-based routing)                                                                                                  |
| **Realtime & Calling**    | Socket.io Client & WebRTC (`@config-plugins/react-native-webrtc`)                                                                                                                   |
| **State Management**      | [Zustand](https://github.com/pmndrs/zustand) with [MMKV](https://github.com/mrousavy/react-native-mmkv) persistence                                                                 |
| **Data Fetching**         | [TanStack React Query v5](https://tanstack.com/query) with offline persistence & [Axios](https://axios-http.com/)                                                                   |
| **Styling & Design**      | [NativeWind v4](https://www.nativewind.dev/) (TailwindCSS) & [Tailwind Variants](https://www.tailwind-variants.org/)                                                                |
| **Testing**               | [Jest](https://jestjs.io/), [jest-expo](https://docs.expo.dev/develop/unit-testing/), and [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) |
| **Graphics & Animations** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) & [Shopify React Native Skia](https://shopify.github.io/react-native-skia/)                          |


---

## Project Structure

   This project follows a feature-driven, modular architecture:

```
rise-chat/
├── assets/                # Static images, custom fonts (.otf), icons, and splash
├── docs/                  # Architecture specs, theming guides, and design system docs
├── src/
│   ├── app/               # Expo Router file-based route definitions and layouts
│   ├── core/              # Global infrastructure (network clients, providers, config)
│   ├── features/          # Domain-driven feature modules
│   │   ├── auth/          # Authentication, OTP verification, welcome flows
│   │   ├── calls/         # WebRTC voice/video call signaling and screens
│   │   ├── chats/         # Chat rooms, messaging, attachments, sockets
│   │   ├── media/         # Audio recorder, camera, media viewer
│   │   ├── security/      # App lock, biometric prompts, passcode guards
│   │   └── settings/      # Theming preferences, app icons, user profile
│   ├── shared/            # Reusable components, hooks, constants, and utilities
│   │   ├── components/    # Reusable UI primitives (BaseButton, BaseText, BaseInput, etc.)
│   │   ├── constants/     # Colors, typography, design tokens
│   │   ├── hooks/         # Generic reusable hooks
│   │   └── utils/         # Pure helper functions (date, uuid, error handling)
│   ├── store/             # Global Zustand stores with MMKV persistence
│   └── types/             # Global TypeScript type definitions
├── __tests__/             # Unit and integration test suites
├── jest.config.js         # Jest test configuration
├── jest.setup.ts          # Native mocks and test environment setup
└── package.json           # Dependencies and project scripts
```

For more architectural details, refer to [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md).


## Getting Started

### Prerequisites

- **Node.js**: `20.x` or higher
- **Package Manager**: `npm`
- **Native Development Environment**:
  - Android: Android Studio with Android SDK and an emulator or connected device.
  - iOS (macOS required): Xcode with CocoaPods and iOS Simulator or device.

> **Note**: Because this project uses native custom modules (such as `react-native-webrtc`, `react-native-mmkv`, and dynamic app icons), running via standard Expo Go is not supported. Use **Expo Prebuild / Development Builds** (`expo run:android` or `expo run:ios`).

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd rise-chat
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your backend endpoint URLs:

```bash
cp .env.example .env
```

```ini
EXPO_PUBLIC_API_URL=https://api.yourbackend.com/v1
EXPO_PUBLIC_WS_URL=wss://api.yourbackend.com/chat
```

### 3. Run the Development Build

Generate and run the native project for your target platform:

#### Android

```bash
npm run android
```

#### iOS

```bash
npm run ios
```

#### Web (Preview)

```bash
npm run web
```

---

## Available Scripts

| Script          | Command            | Description                                          |
| --------------- | ------------------ | ---------------------------------------------------- |
| `start`         | `expo start`       | Starts the Expo development server / Metro bundler   |
| `android`       | `expo run:android` | Builds and runs the native Android app in debug mode |
| `ios`           | `expo run:ios`     | Builds and runs the native iOS app in debug mode     |
| `web`           | `expo start --web` | Runs the web preview                                 |
| `test`          | `jest`             | Runs the test suite                                  |
| `test:watch`    | `jest --watch`     | Runs tests in interactive watch mode                 |
| `test:coverage` | `jest --coverage`  | Generates a test coverage report                     |
| `type-check`    | `tsc --noEmit`     | Validates TypeScript types across the codebase       |
| `lint`          | `expo lint`        | Lints code using ESLint                              |
| `lint-fix`      | `expo lint --fix`  | Automatically fixes autofixable ESLint issues        |

---

## Testing

The project is configured with Jest, `jest-expo`, and React Native Testing Library:

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with code coverage output
npm run test:coverage
```

Test suites are located in `__tests__/`:

- `__tests__/unit/`: Unit tests for pure utilities and components.
- `__tests__/integration/`: Integration tests for Zustand stores, MMKV persistence, and complex flows.

---

## Documentation

Detailed documentation and guides can be found in the [`docs/`](docs/) directory:

- [Authentication Flow](docs/authentication-flow.md)
- [Design System](docs/design-system.md)
- [Theming & Dynamic Colors](docs/theming.md)
- [Component Specifications](docs/components.md)
- [Folder Structure & Architecture](docs/FOLDER_STRUCTURE.md)
- [Git Workflow](docs/GIT_WORKFLOW.md)
