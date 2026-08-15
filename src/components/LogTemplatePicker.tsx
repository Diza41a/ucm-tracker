import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';
import { useLogTemplates } from '@/src/hooks/useLogTemplates';

interface LogTemplatePickerProps {
  onSelect: (contentHtml: string) => void;
}

export function LogTemplatePicker({ onSelect }: LogTemplatePickerProps) {
  const { data: templates } = useLogTemplates();

  if (!templates?.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {templates.map((template) => (
        <Pressable
          key={template.id}
          style={styles.chip}
          onPress={() => onSelect(template.content_html)}>
          <Text style={styles.chipText}>{template.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
});
