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
