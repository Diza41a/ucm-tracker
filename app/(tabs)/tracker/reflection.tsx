import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RichTextEditor } from '@/src/components/RichTextEditor';
import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { DEFAULT_MONTHLY_REFLECTION_HTML } from '@/src/constants/defaultReflectionTemplate';
import { colors, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import {
  useMonthlyReflection,
  useUpsertMonthlyReflection,
} from '@/src/hooks/useMonthlyReflection';
import { formatMonthYear } from '@/src/utils/display';
import { isReflectionUnlocked } from '@/src/utils/monthReflection';

export default function MonthlyReflectionScreen() {
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const navigation = useNavigation();
  const year = Number(params.year);
  const month = Number(params.month);

  const { data: reflection, isLoading, error } = useMonthlyReflection(year, month);
  const upsert = useUpsertMonthlyReflection();

  const [contentHtml, setContentHtml] = useState('');
  const [initialized, setInitialized] = useState(false);

  const unlocked = isReflectionUnlocked(year, month);
  const validParams = Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12;

  useEffect(() => {
    if (initialized || isLoading) return;

    if (reflection) {
      setContentHtml(reflection.content_html);
      setInitialized(true);
      return;
    }

    if (!isLoading) {
      setContentHtml(DEFAULT_MONTHLY_REFLECTION_HTML);
      setInitialized(true);
    }
  }, [reflection, isLoading, initialized]);

  const handleSave = async () => {
    if (!unlocked) {
      Alert.alert('Locked', 'Monthly reflection unlocks on the last day of the month.');
      return;
    }

    try {
      await upsert.mutateAsync({ year, month, content_html: contentHtml });
      Alert.alert('Saved', 'Monthly reflection updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: validParams ? `${formatMonthYear(year, month)} Reflection` : 'Monthly Reflection',
    });
  }, [navigation, year, month, validParams]);

  if (!validParams) {
    return <ErrorState message="Invalid month selected." />;
  }

  if (!unlocked) {
    return (
      <View style={styles.lockedContainer}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
        <Text style={styles.lockedTitle}>Reflection locked</Text>
        <Text style={styles.lockedText}>
          Your monthly reflection for {formatMonthYear(year, month)} unlocks on the last day of
          the month.
        </Text>
      </View>
    );
  }

  if (isLoading || !initialized) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.screenContent}>
        <Text style={styles.intro}>
          Look back on the month — what you practiced, what shifted, and what you want to carry
          forward.
        </Text>
        <RichTextEditor
          value={contentHtml}
          onChange={setContentHtml}
          placeholder="Write your monthly reflection..."
        />
        <FormActionBar>
          <SaveButton
            onPress={handleSave}
            loading={upsert.isPending}
            disabled={!unlocked}
          />
        </FormActionBar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenPadding,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  lockedText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
