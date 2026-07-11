import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/src/components/ui/IconButton';
import { colors, radii } from '@/src/constants/theme';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <IconButton icon="refresh-outline" label="Retry" onPress={onRetry} variant="surface" />
      ) : null}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Ionicons name="file-tray-outline" size={36} color={colors.textMuted} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function InlineEmptyState({
  icon = 'information-circle-outline',
  message,
  actionLabel,
  onAction,
  compact,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.inline, compact && styles.inlineCompact]}>
      <Ionicons name={icon} size={compact ? 18 : 22} color={colors.textMuted} />
      <Text style={[styles.inlineText, compact && styles.inlineTextCompact]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.inlineAction}>
          <Text style={styles.inlineActionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  inline: {
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inlineCompact: {
    padding: 10,
    gap: 6,
  },
  inlineText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inlineTextCompact: {
    fontSize: 13,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  inlineActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
