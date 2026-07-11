import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable, View } from 'react-native';

import { colors } from '@/src/constants/theme';
import { stackScreenOptions, subScreenOptions } from '@/src/constants/stackOptions';

export default function TrackerLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Calendar Tracker',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 14, marginRight: 8 }}>
              <Pressable onPress={() => router.push('/(tabs)/tracker/starred')}>
                <Ionicons name="star-outline" size={24} color={colors.star} />
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/tracker/commitment')}>
                <Ionicons name="options-outline" size={24} color={colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Stack.Screen name="log/[date]" options={{ ...subScreenOptions, title: 'Outing Log' }} />
      <Stack.Screen name="reflection" options={{ ...subScreenOptions, title: 'Monthly Reflection' }} />
      <Stack.Screen name="commitment" options={{ ...subScreenOptions, title: 'Monthly Commitment' }} />
      <Stack.Screen name="starred" options={{ ...subScreenOptions, title: 'Starred Outings' }} />
    </Stack>
  );
}
