import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';

interface CollapsibleFormFieldProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  required?: boolean;
  action?: ReactNode;
  hint?: string;
  children: ReactNode;
  style?: ViewStyle;
  defaultExpanded?: boolean;
}

export function CollapsibleFormField({
  icon,
  title,
  required,
  action,
  hint,
  children,
  style,
  defaultExpanded = true,
}: CollapsibleFormFieldProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[formStyles.field, style]}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.titleButton}
          onPress={() => setExpanded((value) => !value)}
          hitSlop={8}>
          <View style={styles.titleRow}>
            {icon ? <Ionicons name={icon} size={16} color={colors.primary} /> : null}
            <Text style={styles.title}>{title}</Text>
            {required ? <Text style={styles.required}>*</Text> : null}
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textMuted}
            />
          </View>
        </Pressable>
        {action}
      </View>
      {expanded ? children : null}
      {hint ? <Text style={formStyles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleButton: {
    flex: 1,
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
