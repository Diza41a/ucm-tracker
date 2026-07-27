import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/src/constants/theme';

/** Avoid react-native-calendars Image arrows using deprecated style.tintColor on web. */
export function renderCalendarNavigationArrow(direction: 'left' | 'right') {
  return (
    <Ionicons
      name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
      size={20}
      color={colors.primary}
    />
  );
}
