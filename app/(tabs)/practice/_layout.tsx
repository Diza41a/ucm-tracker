import { Stack } from 'expo-router';

import { HeaderBackButton } from '@/src/components/ui/HeaderBackButton';
import { stackScreenOptions, subScreenOptions } from '@/src/constants/stackOptions';

export default function PracticeLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Practice',
          headerLeft: () => <HeaderBackButton fallbackHref="/(tabs)/more" />,
        }}
      />
      <Stack.Screen
        name="word-association"
        options={{ ...subScreenOptions, title: 'Word Association' }}
      />
      <Stack.Screen
        name="feared-fantasy"
        options={{ ...subScreenOptions, title: 'Feared Fantasy' }}
      />
    </Stack>
  );
}
