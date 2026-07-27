import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, tabBarScreenOptions } from '@/src/constants/theme';
import { TAB_BAR_BASE_HEIGHT } from '@/src/hooks/useSafeInsets';
import { createTabPressToRootListener } from '@/src/utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      initialRouteName="tracker"
      safeAreaInsets={{ bottom: insets.bottom }}
      screenOptions={{
        ...tabBarScreenOptions,
        lazy: false,
        tabBarStyle: {
          ...tabBarScreenOptions.tabBarStyle,
          height: TAB_BAR_BASE_HEIGHT + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tracker"
        listeners={createTabPressToRootListener('tracker')}
        options={{
          title: 'Tracker',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stories"
        listeners={createTabPressToRootListener('stories')}
        options={{
          title: 'Stories',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        listeners={createTabPressToRootListener('cards')}
        options={{
          title: 'Cards',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="albums-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wins"
        listeners={createTabPressToRootListener('wins')}
        options={{
          title: 'Wins',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="trophy-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={createTabPressToRootListener('settings')}
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
