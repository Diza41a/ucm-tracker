import { ReactNode, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  richTextHighlightColors,
  richTextTextColors,
  type RichTextToolbarAction,
} from '@/src/constants/richTextEditor';
import { colors, radii } from '@/src/constants/theme';

interface RichTextEditorToolbarProps {
  onAction: (action: RichTextToolbarAction) => void;
  onTextColor: (color: string) => void;
  onHighlightColor: (color: string) => void;
}

type ToolbarIcon = keyof typeof Ionicons.glyphMap;

const TEXT_ACTIONS: { action: RichTextToolbarAction; label: string; textLabel: string }[] = [
  { action: 'bold', label: 'Bold', textLabel: 'B' },
  { action: 'italic', label: 'Italic', textLabel: 'I' },
  { action: 'underline', label: 'Underline', textLabel: 'U' },
  { action: 'strikeThrough', label: 'Strikethrough', textLabel: 'S' },
];

const LIST_ACTIONS: { action: RichTextToolbarAction; icon: ToolbarIcon; label: string }[] = [
  { action: 'insertUnorderedList', icon: 'list-outline', label: 'Bullet list' },
  { action: 'insertOrderedList', icon: 'list', label: 'Numbered list' },
];

const HEADING_ACTIONS: { action: RichTextToolbarAction; label: string; textLabel: string }[] = [
  { action: 'h1', label: 'Heading 1', textLabel: 'H1' },
  { action: 'h2', label: 'Heading 2', textLabel: 'H2' },
];

const INSERT_ACTIONS: { action: RichTextToolbarAction; icon: ToolbarIcon; label: string }[] = [
  { action: 'link', icon: 'link-outline', label: 'Link' },
  { action: 'insertHorizontalRule', icon: 'ellipsis-horizontal', label: 'Divider' },
];

const HISTORY_ACTIONS: { action: RichTextToolbarAction; icon: ToolbarIcon; label: string }[] = [
  { action: 'undo', icon: 'arrow-undo-outline', label: 'Undo' },
  { action: 'redo', icon: 'arrow-redo-outline', label: 'Redo' },
  { action: 'removeFormat', icon: 'close-circle-outline', label: 'Clear formatting' },
];

function ToolbarDivider() {
  return <View style={styles.divider} />;
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

function ToolbarButton({
  icon,
  label,
  textLabel,
  active,
  onPress,
}: {
  icon?: ToolbarIcon;
  label: string;
  textLabel?: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}>
      {textLabel ? (
        <Text style={[styles.textButtonLabel, active && styles.textButtonLabelActive]}>
          {textLabel}
        </Text>
      ) : icon ? (
        <Ionicons
          name={icon}
          size={17}
          color={active ? colors.primary : colors.textSecondary}
        />
      ) : null}
    </Pressable>
  );
}

function ColorSwatch({
  color,
  label,
  clear,
  onPress,
}: {
  color?: string;
  label: string;
  clear?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.colorSwatch, clear ? styles.clearSwatch : { backgroundColor: color }]}
      onPress={onPress}
    />
  );
}

export function RichTextEditorToolbar({
  onAction,
  onTextColor,
  onHighlightColor,
}: RichTextEditorToolbarProps) {
  const [showColors, setShowColors] = useState(false);

  return (
    <View style={styles.panel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mainRow}>
        <ToolbarGroup>
          {TEXT_ACTIONS.map((item) => (
            <ToolbarButton
              key={item.action}
              label={item.label}
              textLabel={item.textLabel}
              onPress={() => onAction(item.action)}
            />
          ))}
        </ToolbarGroup>
        <ToolbarDivider />
        <ToolbarGroup>
          {LIST_ACTIONS.map((item) => (
            <ToolbarButton
              key={item.action}
              icon={item.icon}
              label={item.label}
              onPress={() => onAction(item.action)}
            />
          ))}
        </ToolbarGroup>
        <ToolbarDivider />
        <ToolbarGroup>
          {HEADING_ACTIONS.map((item) => (
            <ToolbarButton
              key={item.action}
              label={item.label}
              textLabel={item.textLabel}
              onPress={() => onAction(item.action)}
            />
          ))}
        </ToolbarGroup>
        <ToolbarDivider />
        <ToolbarGroup>
          {INSERT_ACTIONS.map((item) => (
            <ToolbarButton
              key={item.action}
              icon={item.icon}
              label={item.label}
              onPress={() => onAction(item.action)}
            />
          ))}
        </ToolbarGroup>
        <ToolbarDivider />
        <ToolbarGroup>
          {HISTORY_ACTIONS.map((item) => (
            <ToolbarButton
              key={item.action}
              icon={item.icon}
              label={item.label}
              onPress={() => onAction(item.action)}
            />
          ))}
        </ToolbarGroup>
        <ToolbarDivider />
        <ToolbarButton
          icon="color-palette-outline"
          label="Text and highlight colors"
          active={showColors}
          onPress={() => setShowColors((value) => !value)}
        />
      </ScrollView>

      {showColors ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorRow}>
          <Text style={styles.colorLabel}>A</Text>
          {richTextTextColors.map((option) => (
            <ColorSwatch
              key={option.label}
              color={option.value}
              label={option.label}
              onPress={() => onTextColor(option.value)}
            />
          ))}
          <ToolbarDivider />
          <Text style={styles.colorLabel}>HL</Text>
          {richTextHighlightColors.map((option) => (
            <ColorSwatch
              key={option.label}
              color={option.value === 'transparent' ? undefined : option.value}
              clear={option.value === 'transparent'}
              label={option.label}
              onPress={() => onHighlightColor(option.value)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.toolbar,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },
  button: {
    minWidth: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  textButtonLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  textButtonLabelActive: {
    color: colors.primary,
  },
  colorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 2,
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearSwatch: {
    backgroundColor: colors.surface,
  },
});
