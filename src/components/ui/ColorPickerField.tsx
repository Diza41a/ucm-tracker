import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ColorPicker, { HueSlider, Panel1, Preview } from 'reanimated-color-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors, radii, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import { isValidHexColor, normalizeHexColor } from '@/src/utils/color';

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPickerField({ label, value, onChange }: ColorPickerFieldProps) {
  const [draft, setDraft] = useState(value);
  const [hexInput, setHexInput] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDraft(value);
    setHexInput(value);
  }, [value]);

  const applyHexInput = (text: string) => {
    setHexInput(text);
    const normalized = normalizeHexColor(text);
    if (normalized) {
      setDraft(normalized);
      onChange(normalized);
    }
  };

  const closePicker = () => {
    const normalized = normalizeHexColor(draft) ?? normalizeHexColor(value);
    if (normalized) {
      onChange(normalized);
      setHexInput(normalized);
      setDraft(normalized);
    }
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          style={[styles.swatch, { backgroundColor: value }]}
          onPress={() => {
            setDraft(value);
            setOpen(true);
          }}
          accessibilityLabel={`Pick ${label}`}
        />
        <TextInput
          style={[formStyles.input, styles.hexInput]}
          value={hexInput}
          onChangeText={applyHexInput}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="#RRGGBB"
          placeholderTextColor={colors.textMuted}
          maxLength={7}
        />
        <Pressable style={styles.pickButton} onPress={() => setOpen(true)}>
          <Text style={styles.pickButtonText}>Pick</Text>
        </Pressable>
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={closePicker}>
        <Pressable style={styles.backdrop} onPress={closePicker}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <GestureHandlerRootView style={styles.pickerRoot}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <ColorPicker
                value={draft}
                onChangeJS={(color) => {
                  const hex = normalizeHexColor(color.hex) ?? color.hex;
                  setDraft(hex);
                  setHexInput(hex);
                }}
                style={styles.picker}>
                <Preview style={styles.preview} />
                <Panel1 style={styles.panel} />
                <HueSlider style={styles.slider} />
              </ColorPicker>
              <Pressable
                style={styles.doneButton}
                onPress={() => {
                  if (isValidHexColor(draft)) {
                    onChange(normalizeHexColor(draft)!);
                  }
                  closePicker();
                }}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </GestureHandlerRootView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.labelGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hexInput: {
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 14,
  },
  pickButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerRoot: {
    gap: spacing.md,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  picker: {
    width: '100%',
    gap: spacing.md,
  },
  preview: {
    height: 36,
    borderRadius: radii.sm,
  },
  panel: {
    height: 180,
    borderRadius: radii.sm,
  },
  slider: {
    height: 28,
    borderRadius: radii.pill,
  },
  doneButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    marginTop: spacing.sm,
  },
  doneButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
