import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, surfaceShadow } from '@/src/constants/theme';
import { PRACTICE_GAME_ROUTES, type PracticeGameDefinition } from '@/src/constants/practiceGames';

interface PracticeGameCardProps {
  game: PracticeGameDefinition;
}

export function PracticeGameCard({ game }: PracticeGameCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(PRACTICE_GAME_ROUTES[game.id] as Href)}>
      <View style={styles.iconWrap}>
        <Ionicons name={game.icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.subtitle}>{game.subtitle}</Text>
        <Text style={styles.description}>{game.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...surfaceShadow,
  },
  cardPressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSubtle,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
