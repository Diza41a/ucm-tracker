import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PracticeGameCard } from '@/src/components/practice/PracticeGameCard';
import { PRACTICE_GAMES } from '@/src/constants/practiceGames';
import { colors, spacing } from '@/src/constants/theme';

export default function PracticeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Social practice</Text>
        <Text style={styles.heroBody}>
          Short drills that sharpen conversation skills between outings. More games will land here
          over time.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Games</Text>
        {PRACTICE_GAMES.map((game) => (
          <PracticeGameCard key={game.id} game={game} />
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
