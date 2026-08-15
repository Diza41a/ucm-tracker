import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import { WIN_SAVE_DEBOUNCE_MS } from '@/src/constants/timing';
import { useToggleDailyWinStar, useUpsertDailyWin } from '@/src/hooks/useDailyWins';
import { showAlert } from '@/src/utils/confirm';
import { formatWinDayLabel } from '@/src/utils/display';

interface WinDayEntryProps {
  winDate: string;
  initialContent: string;
  initialStarred?: boolean;
  highlighted?: boolean;
  isToday?: boolean;
}

export function WinDayEntry({
  winDate,
  initialContent,
  initialStarred = false,
  highlighted,
  isToday,
}: WinDayEntryProps) {
  const upsertWin = useUpsertDailyWin();
  const toggleStar = useToggleDailyWinStar();
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [starred, setStarred] = useState(initialStarred);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const savedContentRef = useRef(savedContent);

  contentRef.current = content;
  savedContentRef.current = savedContent;

  useEffect(() => {
    setContent(initialContent);
    setSavedContent(initialContent);
    setStarred(initialStarred);
  }, [winDate]);

  const saveNow = useCallback(
    async (nextContent: string) => {
      if (nextContent.trim() === savedContentRef.current.trim()) return;

      try {
        const result = await upsertWin.mutateAsync({ win_date: winDate, content: nextContent });
        const saved = result?.content ?? '';
        setSavedContent(saved);
        setContent(saved);
        if (result) {
          setStarred(result.starred);
        }
      } catch (error) {
        setContent(savedContentRef.current);
        showAlert('Error', error instanceof Error ? error.message : 'Failed to save win');
      }
    },
    [upsertWin, winDate]
  );

  const scheduleSave = useCallback(
    (nextContent: string) => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(() => {
        saveNow(nextContent);
      }, WIN_SAVE_DEBOUNCE_MS);
    },
    [saveNow]
  );

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  const handleChange = (next: string) => {
    setContent(next);
    scheduleSave(next);
  };

  const handleBlur = () => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    void saveNow(contentRef.current);
  };

  const handleDelete = async () => {
    if (!savedContent.trim()) return;

    const previousContent = savedContent;
    const previousStarred = starred;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    setContent('');
    setSavedContent('');
    setStarred(false);

    try {
      await upsertWin.mutateAsync({ win_date: winDate, content: '' });
    } catch (error) {
      setContent(previousContent);
      setSavedContent(previousContent);
      setStarred(previousStarred);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to delete win');
    }
  };

  const handleToggleStar = async () => {
    if (!savedContent.trim()) return;

    const nextStarred = !starred;
    const previousStarred = starred;
    setStarred(nextStarred);

    try {
      await toggleStar.mutateAsync({ win_date: winDate, starred: nextStarred });
    } catch (error) {
      setStarred(previousStarred);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to update star');
    }
  };

  const hasSavedWin = savedContent.trim().length > 0;
  const isBusy = upsertWin.isPending || toggleStar.isPending;

  return (
    <View
      style={[
        styles.card,
        highlighted && styles.cardHighlighted,
        starred && styles.cardStarred,
        !hasSavedWin && styles.cardUnfilled,
      ]}>
      <View style={styles.headerRow}>
        <Text style={[styles.dateLabel, highlighted && styles.dateLabelHighlighted]}>
          {formatWinDayLabel(winDate)}
        </Text>
        <View style={styles.headerActions}>
          {isBusy ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          {hasSavedWin ? (
            <>
              <Pressable
                onPress={handleToggleStar}
                hitSlop={8}
                accessibilityLabel={starred ? 'Unstar win' : 'Star win'}>
                <Ionicons
                  name={starred ? 'star' : 'star-outline'}
                  size={18}
                  color={starred ? colors.star : colors.textMuted}
                />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8} accessibilityLabel="Delete win">
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
      <TextInput
        style={[formStyles.input, formStyles.textarea, styles.input]}
        value={content}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder={isToday ? 'What went well today?' : 'What went well this day?'}
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHighlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.accentSubtle,
  },
  cardStarred: {
    borderColor: colors.star,
  },
  cardUnfilled: {
    borderStyle: 'dashed',
    opacity: 0.92,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  dateLabelHighlighted: {
    color: colors.primaryLight,
  },
  input: {
    minHeight: 88,
    backgroundColor: colors.surfaceElevated,
  },
});
