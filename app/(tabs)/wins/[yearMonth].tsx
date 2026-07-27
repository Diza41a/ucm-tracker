import { Redirect, useLocalSearchParams } from 'expo-router';

import { WinsMonthView } from '@/src/components/WinsMonthView';
import { parseYearMonthKey, toYearMonthKey } from '@/src/utils/display';

export default function WinsMonthScreen() {
  const { yearMonth } = useLocalSearchParams<{ yearMonth: string }>();
  const parsed = typeof yearMonth === 'string' ? parseYearMonthKey(yearMonth) : null;

  if (!parsed) {
    const now = new Date();
    return <Redirect href={`/(tabs)/wins/${toYearMonthKey(now.getFullYear(), now.getMonth() + 1)}`} />;
  }

  return <WinsMonthView year={parsed.year} month={parsed.month} />;
}
