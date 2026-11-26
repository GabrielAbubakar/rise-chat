import { tokenStorage } from '@/services/api/token';
import { enqueueSecureOp } from '@/services/session/secureStoreQueue';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'user_pin_code';

/**
 * Saves the PIN for the current session through the secure-op queue (R9), so
 * it is ordered after any earlier session's in-flight PIN write and its
 * logout's PIN delete. Returns false (without writing) if the session ended
 * while it waited, or false after writing if it ended mid-write — in that
 * case the ending session's logout delete is queued behind it and erases it.
 */
export function savePinCode(pin: string): Promise<boolean> {
  const generation = tokenStorage.getSessionGeneration();
  return enqueueSecureOp(async () => {
    if (generation !== tokenStorage.getSessionGeneration()) return false;
    await SecureStore.setItemAsync(PIN_KEY, pin);
    return generation === tokenStorage.getSessionGeneration();
  });
}

export async function verifyPinCode(pin: string): Promise<boolean> {
  const storedPin = await SecureStore.getItemAsync(PIN_KEY);
  return storedPin === pin;
}

export async function getPinCode(): Promise<string | null> {
  return await SecureStore.getItemAsync(PIN_KEY);
}

/**
 * Deletes the stored PIN, queued behind any PIN write already in flight.
 * Rejects on failure so logout can report it.
 */
export function clearPinCode(): Promise<void> {
  return enqueueSecureOp(() => SecureStore.deleteItemAsync(PIN_KEY));
}
