import { createMMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

export interface AppStorage extends StateStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export function createZustandStorage(id: string): AppStorage {
  const storage = createMMKV({ id });

  return {
    setItem: (name, value) => {
      storage.set(name, value);
    },
    getItem: (name) => {
      const value = storage.getString(name);
      return value ?? null;
    },
    removeItem: (name) => {
      storage.remove(name);
    },
  };
}
