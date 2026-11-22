import { tokenStorage } from '@/services/api/token';
import { waitForSessionCleanup } from '@/services/session/cleanupBarrier';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'user_pin_code';

/**
 * Saves the PIN for the current session. Waits for any earlier logout's PIN
 * deletion first, so a slow delete from a previous account cannot erase it.
 * Returns false (without writing) if the session ended while waiting.
 */
export async function savePinCode(pin: string): Promise<boolean> {
  const generation = tokenStorage.getSessionGeneration();
  await waitForSessionCleanup();
  if (generation !== tokenStorage.getSessionGeneration()) return false;
  await SecureStore.setItemAsync(PIN_KEY, pin);
  return generation === tokenStorage.getSessionGeneration();
}

export async function verifyPinCode(pin: string): Promise<boolean> {
  const storedPin = await SecureStore.getItemAsync(PIN_KEY);
  return storedPin === pin;
}

export async function getPinCode(): Promise<string | null> {
  return await SecureStore.getItemAsync(PIN_KEY);
}

/** Deletes the stored PIN. Rejects on failure so logout can report it. */
export async function clearPinCode(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
