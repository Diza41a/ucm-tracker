import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAuth } from '@/src/hooks/useAuth';
import { refreshAndroidWidgets } from '@/src/widgets/syncWidgetSnapshot';

export function WidgetSyncProvider({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'android' || loading || !session) return;
    void refreshAndroidWidgets();
  }, [loading, session]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshAndroidWidgets();
      }
    });

    return () => subscription.remove();
  }, []);

  return children;
}
