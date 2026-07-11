import { Ionicons } from '@expo/vector-icons';
import { type Href, useSegments } from 'expo-router';
import { Pressable } from 'react-native';

import { colors } from '@/src/constants/theme';
import { navigateBack } from '@/src/utils/navigation';

const TAB_ROOTS: Record<string, Href> = {
  stories: '/(tabs)/stories',
  cards: '/(tabs)/cards',
  tracker: '/(tabs)/tracker',
  settings: '/(tabs)/settings',
};

type HeaderBackButtonProps = {
  fallbackHref?: Href;
};

export function HeaderBackButton({ fallbackHref }: HeaderBackButtonProps) {
  const segments = useSegments();
  const tabSegment = segments.find((segment) => segment in TAB_ROOTS);
  const fallback = fallbackHref ?? (tabSegment ? TAB_ROOTS[tabSegment] : '/(tabs)/tracker');

  return (
    <Pressable
      onPress={() => navigateBack(fallback)}
      hitSlop={8}
      style={{ marginLeft: 8, padding: 4 }}
      accessibilityLabel="Go back"
      accessibilityRole="button">
      <Ionicons name="chevron-back" size={24} color={colors.text} />
    </Pressable>
  );
}
