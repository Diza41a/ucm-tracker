import { Alert } from 'react-native';

export function confirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>
) {
  const runConfirm = () => {
    void Promise.resolve(onConfirm()).catch(() => {});
  };

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: runConfirm },
  ]);
}

export function showAlert(title: string, message: string) {
  Alert.alert(title, message);
}
