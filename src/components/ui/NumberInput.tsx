import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { formStyles } from '@/src/constants/form';
import { colors } from '@/src/constants/theme';

function sanitizeNumericInput(text: string, allowFloat: boolean) {
  if (!allowFloat) {
    return text.replace(/[^0-9]/g, '');
  }

  const cleaned = text.replace(/[^0-9.]/g, '');
  const [whole, ...fraction] = cleaned.split('.');
  if (fraction.length === 0) return whole;
  return `${whole}.${fraction.join('')}`;
}

interface NumberInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> {
  value: string;
  onChangeText: (value: string) => void;
  allowFloat?: boolean;
  suffix?: string;
}

export function NumberInput({
  value,
  onChangeText,
  allowFloat = false,
  suffix,
  style,
  ...rest
}: NumberInputProps) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        {...rest}
        style={[styles.input, style]}
        value={value}
        onChangeText={(text) => onChangeText(sanitizeNumericInput(text, allowFloat))}
        keyboardType={allowFloat ? 'decimal-pad' : 'number-pad'}
        inputMode={allowFloat ? 'decimal' : 'numeric'}
      />
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    ...formStyles.input,
    flex: 1,
  },
  suffix: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
