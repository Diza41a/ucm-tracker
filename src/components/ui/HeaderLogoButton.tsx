import { router } from 'expo-router';
import { Image, Pressable } from 'react-native';

const logo = require('@/assets/images/logo.png');

export function HeaderLogoButton() {
  return (
    <Pressable
      onPress={() => router.navigate('/(tabs)/tracker')}
      hitSlop={8}
      style={{ marginLeft: 12, padding: 2 }}
      accessibilityLabel="Go to tracker"
      accessibilityRole="button">
      <Image source={logo} style={{ width: 32, height: 32, borderRadius: 8 }} />
    </Pressable>
  );
}
