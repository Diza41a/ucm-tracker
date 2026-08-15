import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HubLinkCard } from '@/src/components/ui/HubLinkCard';
import { MORE_LINKS } from '@/src/constants/hubLinks';
import { colors, spacing } from '@/src/constants/theme';

export default function MoreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>More</Text>
        <Text style={styles.heroBody}>
          Practice drills, templates, and other tools that sit outside your daily tracker flow.
        </Text>
      </View>

      <View style={styles.section}>
        {MORE_LINKS.map((item) => (
          <HubLinkCard key={item.href} item={item} />
        ))}
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
    padding: spacing.screenPadding,
    paddingBottom: 40,
    gap: spacing.fieldGap,
  },
  hero: {
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.md,
  },
});
