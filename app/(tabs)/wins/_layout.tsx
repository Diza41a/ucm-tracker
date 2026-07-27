import { Stack } from 'expo-router';

import { HeaderLogoButton } from '@/src/components/ui/HeaderLogoButton';
import { stackScreenOptions } from '@/src/constants/stackOptions';
import { formatMonthYear } from '@/src/utils/display';

export default function WinsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[yearMonth]"
        options={({ route }) => {
          const yearMonth = (route.params as { yearMonth?: string })?.yearMonth;
          const match = yearMonth?.match(/^(\d{4})-(\d{2})$/);
          const title =
            match && match[1] && match[2]
              ? formatMonthYear(Number(match[1]), Number(match[2]))
              : 'Wins';

          return {
            title,
            headerBackVisible: false,
            headerLeft: () => <HeaderLogoButton />,
          };
        }}
      />
    </Stack>
  );
}
