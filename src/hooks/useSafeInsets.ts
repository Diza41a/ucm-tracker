import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_BASE_HEIGHT = 62;

export function useSafeInsets() {
  const insets = useSafeAreaInsets();

  return {
    ...insets,
    tabBarHeight: TAB_BAR_BASE_HEIGHT + insets.bottom,
    screenBottomPadding: insets.bottom + 16,
    footerBottomOffset: insets.bottom,
  };
}
