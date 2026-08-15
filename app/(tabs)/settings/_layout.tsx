import { Stack } from 'expo-router';

import { HeaderBackButton } from '@/src/components/ui/HeaderBackButton';
import { stackScreenOptions, subScreenOptions } from '@/src/constants/stackOptions';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerLeft: () => <HeaderBackButton fallbackHref="/(tabs)/more" />,
        }}
      />
      <Stack.Screen name="templates" options={{ ...subScreenOptions, title: 'Log Templates' }} />
      <Stack.Screen name="user-guide" options={{ ...subScreenOptions, title: 'User Guide' }} />
    </Stack>
  );
}
