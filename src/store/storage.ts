import { createMMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

export function createZustandStorage(id: string): StateStorage {
  const storage = createMMKV({ id });

  return {
    setItem: (name, value) => {
      return storage.set(name, value);
    },
    getItem: (name) => {
      const value = storage.getString(name);
      return value ?? null;
    },
    removeItem: (name) => {
      return storage.remove(name);
    },
  };
}
