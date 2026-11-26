import Toast from 'react-native-toast-message';
import { AppError } from './AppError';

/**
 * Displays an API error using a toast message.
 * Extracts the specific backend error message if available.
 */
export function showApiErrorToast(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred.',
  title: string = 'Request Failed'
) {
  // Work from a previous session (logout / account switch) is discarded silently;
  // it must not surface as an error in the new session. Checked by name to keep
  // shared utils free of service imports (see services/session/staleSession).
  if ((error as { name?: unknown } | null)?.name === 'StaleSessionError') {
    return;
  }

  let errorMessage = defaultMessage;
  
  if (error instanceof AppError) {
    errorMessage = error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  Toast.show({
    type: 'error',
    text1: title,
    text2: errorMessage,
  });
}
