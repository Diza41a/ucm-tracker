import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/src/constants/stackOptions';

export default function LibraryLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Library' }} />
    </Stack>
  );
}
