import { Redirect } from 'expo-router';

import { toYearMonthKey } from '@/src/utils/display';

export default function WinsIndexScreen() {
  const now = new Date();
  const yearMonth = toYearMonthKey(now.getFullYear(), now.getMonth() + 1);
  return <Redirect href={`/(tabs)/wins/${yearMonth}`} />;
}
