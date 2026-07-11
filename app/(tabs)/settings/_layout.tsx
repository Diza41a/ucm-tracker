import { Stack } from 'expo-router';

import { stackScreenOptions, subScreenOptions } from '@/src/constants/stackOptions';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="templates" options={{ ...subScreenOptions, title: 'Log Templates' }} />
    </Stack>
  );
}
