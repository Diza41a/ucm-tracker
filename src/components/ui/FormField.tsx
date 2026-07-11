import { ReactNode } from 'react';
import { Text, View, ViewStyle } from 'react-native';

import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { formStyles } from '@/src/constants/form';

interface FormFieldProps {
  icon?: Parameters<typeof SectionHeader>[0]['icon'];
  title: string;
  required?: boolean;
  action?: ReactNode;
  hint?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function FormField({
  icon,
  title,
  required,
  action,
  hint,
  children,
  style,
}: FormFieldProps) {
  return (
    <View style={[formStyles.field, style]}>
      <SectionHeader icon={icon} title={title} required={required} action={action} />
      {children}
      {hint ? <Text style={formStyles.hint}>{hint}</Text> : null}
    </View>
  );
}
