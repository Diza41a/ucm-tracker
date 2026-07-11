import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, router } from 'expo-router';

import { MonthPicker } from '@/src/components/MonthPicker';
import { LoadingState } from '@/src/components/StateViews';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { NumberInput } from '@/src/components/ui/NumberInput';
import { colors, radii, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import {
  useCreateMonthlyCommitment,
  useMonthlyCommitment,
} from '@/src/hooks/useMonthlyCommitment';

export default function CommitmentScreen() {
  const navigation = useNavigation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [outingsPerWeek, setOutingsPerWeek] = useState('3');
  const [durationMinutes, setDurationMinutes] = useState('60');

  const { data: commitment, isLoading } = useMonthlyCommitment(year, month);
  const createCommitment = useCreateMonthlyCommitment();
  const isLocked = !!commitment;

  useEffect(() => {
    if (commitment) {
      setOutingsPerWeek(String(commitment.outings_per_week));
      setDurationMinutes(String(commitment.outing_duration_minutes));
    } else {
      setOutingsPerWeek('3');
      setDurationMinutes('60');
    }
  }, [commitment]);

  const handleSave = useCallback(
    async (goBack = false) => {
      if (isLocked) return;

      const outings = parseInt(outingsPerWeek, 10);
      const duration = parseInt(durationMinutes, 10);

      if (isNaN(outings) || outings < 0 || outings > 14) {
        Alert.alert('Validation', 'Outings per week must be 0-14.');
        return;
      }
      if (isNaN(duration) || duration < 0) {
        Alert.alert('Validation', 'Duration must be a positive number.');
        return;
      }

      try {
        await createCommitment.mutateAsync({
          year,
          month,
          outings_per_week: outings,
          outing_duration_minutes: duration,
        });

        if (goBack) {
          router.back();
          return;
        }

        if (Platform.OS !== 'web') {
          Alert.alert('Saved', 'Monthly commitment set.');
        }
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
      }
    },
    [createCommitment, durationMinutes, isLocked, month, outingsPerWeek, year]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isLocked ? 'Monthly Commitment' : 'Set Commitment',
    });
  }, [navigation, isLocked]);

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={formStyles.screenContent}>
      <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      {isLocked ? (
        <>
          <View style={styles.lockedBanner}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.lockedText}>
              This month's commitment is set and cannot be changed.
            </Text>
          </View>

          <FormField icon="calendar-outline" title="Outings per week">
            <View style={styles.readOnlyValue}>
              <Text style={styles.readOnlyText}>{commitment.outings_per_week}</Text>
            </View>
          </FormField>

          <FormField icon="time-outline" title="Duration per outing">
            <View style={styles.readOnlyValue}>
              <Text style={styles.readOnlyText}>{commitment.outing_duration_minutes} min</Text>
            </View>
          </FormField>
        </>
      ) : (
        <>
          <Text style={formStyles.description}>
            Set how many outings you commit to each week and how long each outing should be.
            Once saved, this cannot be changed for the month.
          </Text>

          <FormField icon="calendar-outline" title="Outings per week" required>
            <NumberInput
              value={outingsPerWeek}
              onChangeText={setOutingsPerWeek}
              placeholder="e.g. 3"
              placeholderTextColor={colors.textMuted}
            />
          </FormField>

          <FormField icon="time-outline" title="Duration per outing" required>
            <NumberInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="e.g. 60"
              placeholderTextColor={colors.textMuted}
              suffix="min"
            />
          </FormField>

          <FormActionBar>
            <SaveButton
              label="Save & done"
              onPress={() => handleSave(true)}
              loading={createCommitment.isPending}
            />
          </FormActionBar>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: spacing.fieldGap,
  },
  lockedText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  readOnlyValue: {
    ...formStyles.input,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
