import { Ionicons } from '@expo/vector-icons';
import { type Href, useNavigation, useSegments } from 'expo-router';
import { Pressable } from 'react-native';

import { colors } from '@/src/constants/theme';
import { navigateBack } from '@/src/utils/navigation';
import { toYearMonthKey } from '@/src/utils/display';

function getWinsTabRoot(): Href {
  const now = new Date();
  return `/(tabs)/wins/${toYearMonthKey(now.getFullYear(), now.getMonth() + 1)}`;
}

const TAB_ROOTS: Record<string, Href> = {
  stories: '/(tabs)/library',
  cards: '/(tabs)/library',
  tracker: '/(tabs)/tracker',
  settings: '/(tabs)/more',
  practice: '/(tabs)/more',
  library: '/(tabs)/library',
  more: '/(tabs)/more',
  wins: getWinsTabRoot(),
};

type HeaderBackButtonProps = {
  fallbackHref?: Href;
};

export function HeaderBackButton({ fallbackHref }: HeaderBackButtonProps) {
  const navigation = useNavigation();
  const segments = useSegments();
  const tabSegment = segments.find((segment) => segment in TAB_ROOTS);
  const fallback = fallbackHref ?? (tabSegment ? TAB_ROOTS[tabSegment] : '/(tabs)/tracker');

  return (
    <Pressable
      onPress={() => navigateBack(navigation, fallback)}
      hitSlop={8}
      style={{ marginLeft: 8, padding: 4 }}
      accessibilityLabel="Go back"
      accessibilityRole="button">
      <Ionicons name="chevron-back" size={24} color={colors.text} />
    </Pressable>
  );
}
