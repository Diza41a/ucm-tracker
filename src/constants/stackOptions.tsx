import { HeaderBackButton } from '@/src/components/ui/HeaderBackButton';
import { HeaderLogoButton } from '@/src/components/ui/HeaderLogoButton';

import { colors } from './theme';

const baseStackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
  headerBackVisible: false,
};

export const stackScreenOptions = {
  ...baseStackScreenOptions,
  headerLeft: () => <HeaderLogoButton />,
};

export const subScreenOptions = {
  ...baseStackScreenOptions,
  headerLeft: () => <HeaderBackButton />,
};
