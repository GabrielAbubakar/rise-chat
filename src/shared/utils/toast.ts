import Toast from 'react-native-toast-message';

/**
 * Displays a success message using a toast.
 */
export function showSuccessToast(
  message: string,
  title: string = 'Success'
) {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
  });
}

/**
 * Displays an info message using a pill-style toast at the bottom of the screen.
 */
export function showInfoToast(
  message: string,
  title?: string
) {
  Toast.show({
    type: 'info',
    position: 'bottom',
    bottomOffset: 40,
    text1: title || message,
    text2: title ? message : undefined,
  });
}

/**
 * Displays an error message using a toast.
 */
export function showErrorToast(
  message: string,
  title: string = 'Error'
) {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
  });
}
