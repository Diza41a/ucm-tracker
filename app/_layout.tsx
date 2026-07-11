import 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { appDarkTheme, ThemeProvider } from '@/src/constants/navigation';
import { colors } from '@/src/constants/theme';
import { AuthProvider } from '@/src/hooks/useAuth';
import { QueryProvider } from '@/src/lib/queryClient';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading failed:', error);
      SplashScreen.hideAsync();
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <ThemeProvider value={appDarkTheme}>
          <QueryProvider>
            <AuthProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: colors.background },
                  ...(Platform.OS === 'android'
                    ? { animation: 'fade_from_bottom' as const }
                    : {}),
                }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
