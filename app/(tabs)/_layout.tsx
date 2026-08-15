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
        name="library"
        listeners={createTabPressToRootListener('library')}
        options={{
          title: 'Library',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="library-outline" size={22} color={color} />
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
        name="more"
        listeners={createTabPressToRootListener('more')}
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="ellipsis-horizontal-circle-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
