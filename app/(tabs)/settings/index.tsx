import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { colors, radii } from '@/src/constants/theme';
import {
  useEnsureDefaultTemplate,
  useLogTemplates,
  useSetDefaultLogTemplate,
} from '@/src/hooks/useLogTemplates';

export default function SettingsScreen() {
  const { data: templates, isLoading, error, refetch } = useLogTemplates();
  const setDefault = useSetDefaultLogTemplate();
  const ensureDefault = useEnsureDefaultTemplate();

  useEffect(() => {
    ensureDefault.mutate();
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Log templates</Text>
        </View>
        <Text style={styles.hint}>
          Templates prefill new day logs. Pick one as the default, or manage all templates below.
        </Text>
        {templates?.map((template) => (
          <Pressable
            key={template.id}
            style={[
              styles.templateRow,
              template.is_default && styles.templateRowActive,
            ]}
            onPress={() => setDefault.mutate(template.id)}>
            <View style={styles.templateNameRow}>
              {template.is_default ? (
                <Ionicons name="star" size={14} color={colors.star} />
              ) : (
                <Ionicons name="document-outline" size={14} color={colors.textMuted} />
              )}
              <Text
                style={[
                  styles.templateName,
                  template.is_default && styles.templateNameActive,
                ]}>
                {template.name}
              </Text>
            </View>
            {template.is_default ? (
              <Text style={styles.defaultBadge}>Default</Text>
            ) : null}
          </Pressable>
        ))}
        <Pressable
          style={styles.linkBtn}
          onPress={() => router.push('/(tabs)/settings/templates')}>
          <Ionicons name="settings-outline" size={16} color={colors.primary} />
          <Text style={styles.linkText}>Manage log templates</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  templateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  templateRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  templateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  templateNameActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  defaultBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  linkText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
