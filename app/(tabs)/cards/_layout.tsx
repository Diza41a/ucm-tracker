import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';

import { colors } from '@/src/constants/theme';
import { stackScreenOptions, subScreenOptions } from '@/src/constants/stackOptions';
import { useCardTypes } from '@/src/hooks/useCardTypes';

function CardsHeaderActions() {
  const { data: cardTypes } = useCardTypes();
  const canCreateCard = (cardTypes?.length ?? 0) > 0;

  const handleNewCard = () => {
    if (!canCreateCard) {
      Alert.alert(
        'Card types required',
        'Create at least one card type before adding cards.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Manage types', onPress: () => router.push('/(tabs)/cards/types') },
        ]
      );
      return;
    }
    router.push('/(tabs)/cards/new');
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 }}>
      <Pressable onPress={() => router.push('/(tabs)/cards/types')}>
        <Ionicons name="layers-outline" size={24} color={colors.primary} />
      </Pressable>
      <Pressable onPress={handleNewCard}>
        <Ionicons
          name="add"
          size={28}
          color={canCreateCard ? colors.primary : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

export default function CardsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Card Pool',
          headerRight: () => <CardsHeaderActions />,
        }}
      />
      <Stack.Screen name="[id]" options={{ ...subScreenOptions, title: 'Card' }} />
      <Stack.Screen name="types" options={{ ...subScreenOptions, title: 'Card Types' }} />
      <Stack.Screen name="priorities" options={{ ...subScreenOptions, title: 'Monthly Priorities' }} />
    </Stack>
  );
}
