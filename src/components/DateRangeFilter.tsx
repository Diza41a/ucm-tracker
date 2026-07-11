import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

import { colors, calendarTheme, radii, spacing } from '@/src/constants/theme';
import { parseDateString } from '@/src/utils/display';

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
}

type ActivePicker = 'start' | 'end' | null;

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return 'Any';
  return parseDateString(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const handleDayPress = (day: DateData) => {
    if (activePicker === 'start') {
      onStartDateChange(day.dateString);
      if (endDate && day.dateString > endDate) {
        onEndDateChange(null);
      }
    } else if (activePicker === 'end') {
      onEndDateChange(day.dateString);
      if (startDate && day.dateString < startDate) {
        onStartDateChange(day.dateString);
      }
    }
    setActivePicker(null);
  };

  const activeValue = activePicker === 'start' ? startDate : endDate;
  const pickerTitle = activePicker === 'start' ? 'Start date' : 'End date';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          style={styles.field}
          onPress={() => setActivePicker('start')}>
          <Text style={styles.fieldLabel}>From</Text>
          <View style={styles.fieldValueRow}>
            <Text style={[styles.fieldValue, !startDate && styles.fieldPlaceholder]}>
              {formatDisplayDate(startDate)}
            </Text>
            {startDate ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onStartDateChange(null);
                }}
                hitSlop={6}
                style={styles.clearBtn}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            ) : (
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            )}
          </View>
        </Pressable>

        <Text style={styles.separator}>–</Text>

        <Pressable
          style={styles.field}
          onPress={() => setActivePicker('end')}>
          <Text style={styles.fieldLabel}>To</Text>
          <View style={styles.fieldValueRow}>
            <Text style={[styles.fieldValue, !endDate && styles.fieldPlaceholder]}>
              {formatDisplayDate(endDate)}
            </Text>
            {endDate ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onEndDateChange(null);
                }}
                hitSlop={6}
                style={styles.clearBtn}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            ) : (
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            )}
          </View>
        </Pressable>
      </View>

      <Modal
        visible={activePicker !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setActivePicker(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActivePicker(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerTitle}</Text>
              <Pressable onPress={() => setActivePicker(null)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <Calendar
              current={activeValue ?? undefined}
              onDayPress={handleDayPress}
              minDate={activePicker === 'end' ? startDate ?? undefined : undefined}
              maxDate={activePicker === 'start' ? endDate ?? undefined : undefined}
              markedDates={
                activeValue
                  ? {
                      [activeValue]: {
                        selected: true,
                        selectedColor: colors.primary,
                      },
                    }
                  : undefined
              }
              theme={calendarTheme}
              enableSwipeMonths
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  field: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  fieldPlaceholder: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 2,
  },
  separator: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
});
