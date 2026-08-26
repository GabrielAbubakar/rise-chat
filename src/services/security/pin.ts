import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'user_pin_code';

export async function savePinCode(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function verifyPinCode(pin: string): Promise<boolean> {
  const storedPin = await SecureStore.getItemAsync(PIN_KEY);
  return storedPin === pin;
}

export async function getPinCode(): Promise<string | null> {
  return await SecureStore.getItemAsync(PIN_KEY);
}

export async function clearPinCode(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
