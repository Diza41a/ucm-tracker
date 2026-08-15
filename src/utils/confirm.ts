import { Alert, Platform } from 'react-native';

export function confirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>
) {
  const runConfirm = () => {
    void Promise.resolve(onConfirm()).catch((error) => {
      showAlert('Error', error instanceof Error ? error.message : 'Something went wrong');
    });
  };

  if (Platform.OS === 'web') {
    if (window.confirm([title, message].filter(Boolean).join('\n\n'))) {
      runConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: runConfirm },
  ]);
}

export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert([title, message].filter(Boolean).join('\n\n'));
    return;
  }

  Alert.alert(title, message);
}
