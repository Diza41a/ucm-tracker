import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable, View } from 'react-native';

import { colors } from '@/src/constants/theme';
import { stackScreenOptions, subScreenOptions } from '@/src/constants/stackOptions';
import { HeaderLogoButton } from '@/src/components/ui/HeaderLogoButton';

export default function StoriesLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Stories',
          headerBackVisible: false,
          headerLeft: () => <HeaderLogoButton />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 }}>
              <Pressable onPress={() => router.push('/(tabs)/stories/tags')}>
                <Ionicons name="pricetags-outline" size={24} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/stories/new')}>
                <Ionicons name="add" size={28} color={colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Stack.Screen name="[id]" options={{ ...subScreenOptions, title: 'Story' }} />
      <Stack.Screen name="tags" options={{ ...subScreenOptions, title: 'Story Tags' }} />
    </Stack>
  );
}
