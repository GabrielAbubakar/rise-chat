# Project Folder Structure

This document outlines the architectural organization of the `rise-chat` codebase. We follow a modular, feature-based architecture built on top of Expo Router, designed for scalability and clear separation of concerns.

## Root Directory

- **`/assets`**: Contains static assets like images, custom fonts (`.otf`), and SVGs.
- **`/docs`**: Project documentation and architecture guidelines (like this file).
- **`/scripts`**: Utility scripts for development (e.g., project reset, build helpers).
- **`/src`**: The main source code directory (detailed below).
- **Configuration Files**: `app.json` (Expo config), `eas.json` (EAS Build), `tailwind.config.js` (NativeWind), `metro.config.js`, etc.

---

## The `/src` Directory

The `/src` directory is the heart of the application.

### `/src/app` (Routing Layer)
Powered by Expo Router, this handles file-based routing.
- Contains only layout files (`_layout.tsx`) and route endpoints (e.g., `index.tsx`, `welcome.tsx`).
- **Rule of thumb**: Complex UI and business logic are **not** written here. Route files simply import high-level Screen components from the `/features` directory.

### `/src/core` (Core Application Layer)
Contains globally essential infrastructure that does not belong to a specific feature.
- Network clients (e.g., Axios/React Query setups)
- Global providers and contexts
- Authentication core logic

### `/src/features` (Feature Modules)
Contains business-logic driven feature modules. This keeps code highly cohesive and encapsulated.
- Each folder represents a domain (e.g., `auth`, `chat`, `profile`).
- Inside each feature folder, you will typically find:
  - `/components`: UI components specific to this feature.
  - `/screens`: High-level screen components that get imported into `/src/app`.
  - `/api` or `/services`: Network requests and queries specific to this feature.
  - `/hooks`: Custom logic hooks specific to this feature.

### `/src/shared` (Shared UI & Utilities)
Contains highly reusable, domain-agnostic components and logic used across the entire app.
- **`/components`**: Generic UI components (e.g., `BaseButton`, `BaseText`, `ScreenContainer`). These components should be "dumb" (no business logic, just UI).
- **`/constants`**: App-wide constants and design tokens (theme colors, typography spec).
- **`/hooks`**: Reusable generic hooks (e.g., `useKeyboard`, `useDebounce`).
- **`/utils`**: Helper functions (e.g., date formatting, string manipulation).
- **`/types`**: Global TypeScript definitions.

### `/src/store` (Global State)
Global state management (using Zustand).
- e.g., `useThemeStore.ts` for managing Day/Night modes.
- Note: Feature-specific state should ideally remain local to its feature unless it absolutely must be accessed globally.

---

## Key Architectural Rules

1. **Keep Routing Clean**: `src/app` files should be short. Assemble your UI in `src/features/.../screens` and export them.
2. **Feature Encapsulation**: A feature (e.g., `auth`) should not import internal components directly from another feature (e.g., `chat`). If they both need the same code, move that code to `src/shared`.
3. **Shared Components are "Dumb"**: Components in `src/shared/components` should never fetch their own data or have domain knowledge. They strictly receive props and emit events.
4. **Barrel Files**: Always use `index.ts` barrel files inside `/shared` directories to keep import statements clean (e.g., `import { BaseButton } from "@/shared/components";`).
