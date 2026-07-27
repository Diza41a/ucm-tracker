import { Switch, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/constants/theme';

export type ViewEditMode = 'view' | 'edit';

interface ViewEditSwitchProps {
  mode: ViewEditMode;
  onModeChange: (mode: ViewEditMode) => void;
  disabled?: boolean;
}

export function ViewEditSwitch({ mode, onModeChange, disabled }: ViewEditSwitchProps) {
  const isEdit = mode === 'edit';

  return (
    <View style={styles.row}>
      <Text style={[styles.label, !isEdit && styles.labelActive]}>View</Text>
      <Switch
        value={isEdit}
        disabled={disabled}
        onValueChange={(next) => onModeChange(next ? 'edit' : 'view')}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.onPrimary}
        ios_backgroundColor={colors.border}
      />
      <Text style={[styles.label, isEdit && styles.labelActive]}>Edit</Text>
    </View>
  );
}

export function defaultViewEditMode(content: string): ViewEditMode {
  return content.trim() ? 'view' : 'edit';
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
  },
});
