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
