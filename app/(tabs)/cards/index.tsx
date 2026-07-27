import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { CardTableView } from '@/src/components/CardTableView';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import { useCards } from '@/src/hooks/useCards';
import { View } from 'react-native';

export default function CardsListScreen() {
  const { data: cards, isLoading, error, refetch } = useCards();
  const { data: cardTypes } = useCardTypes();

  if (isLoading && !cards) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const emptyMessage = cards?.length
    ? 'No cards match your filters.'
    : cardTypes?.length
      ? 'No cards yet. Tap + to create one.'
      : 'Create a card type first, then add cards.';

  return (
    <View style={{ flex: 1 }}>
      <CardTableView cards={cards ?? []} emptyMessage={emptyMessage} />
    </View>
  );
}