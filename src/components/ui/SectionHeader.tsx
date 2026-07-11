import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors } from '@/src/constants/theme';

interface SectionHeaderProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  required?: boolean;
  action?: ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ icon, title, required, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleRow}>
        {icon ? <Ionicons name={icon} size={16} color={colors.primary} /> : null}
        <Text style={styles.title}>{title}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  required: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginLeft: 2,
  },
});
