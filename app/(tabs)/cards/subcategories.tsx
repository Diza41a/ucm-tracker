import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CardSubcategoryBadge } from '@/src/components/CardSubcategoryBadge';
import { ErrorState, InlineEmptyState, LoadingState } from '@/src/components/StateViews';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { IconButton } from '@/src/components/ui/IconButton';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { colors, radii, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import {
  useCardSubcategories,
  useCreateCardSubcategory,
  useDeleteCardSubcategory,
  useUpdateCardSubcategory,
} from '@/src/hooks/useCardSubcategories';
import { useCards } from '@/src/hooks/useCards';
import type { CardSubcategory } from '@/src/types';

export default function CardSubcategoriesScreen() {
  const navigation = useNavigation();
  const { data: subcategories, isLoading, error, refetch } = useCardSubcategories();
  const { data: cards } = useCards();
  const createSubcategory = useCreateCardSubcategory();
  const updateSubcategory = useUpdateCardSubcategory();
  const deleteSubcategory = useDeleteCardSubcategory();

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  const isSaving = createSubcategory.isPending || updateSubcategory.isPending;

  const cardCountBySubcategory = useMemo(() => {
    const counts: Record<string, number> = {};
    cards?.forEach((card) => {
      card.subcategories?.forEach((subcategory) => {
        counts[subcategory.id] = (counts[subcategory.id] ?? 0) + 1;
      });
    });
    return counts;
  }, [cards]);

  const resetForm = useCallback(() => {
    setName('');
    setEditingId(null);
  }, []);

  const closeForm = useCallback(() => {
    resetForm();
    setFormVisible(false);
  }, [resetForm]);

  const openCreateForm = useCallback(() => {
    resetForm();
    setFormVisible(true);
  }, [resetForm]);

  const startEdit = useCallback((subcategory: CardSubcategory) => {
    setEditingId(subcategory.id);
    setName(subcategory.name);
    setFormVisible(true);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={openCreateForm}
          hitSlop={8}
          accessibilityLabel="Add subcategory"
          accessibilityRole="button"
          style={styles.headerBtn}>
          <Ionicons name="add" size={28} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, openCreateForm]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }

    try {
      if (editingId) {
        await updateSubcategory.mutateAsync({ id: editingId, name: name.trim() });
      } else {
        await createSubcategory.mutateAsync({ name: name.trim() });
      }
      closeForm();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleDelete = (id: string) => {
    const cardCount = cardCountBySubcategory[id] ?? 0;
    if (cardCount > 0) {
      Alert.alert(
        'Cannot delete',
        `This subcategory is used by ${cardCount} card${cardCount === 1 ? '' : 's'}. Remove it from those cards first.`
      );
      return;
    }

    Alert.alert('Delete subcategory', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubcategory.mutateAsync(id);
            if (editingId === id) closeForm();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={subcategories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <InlineEmptyState
            icon="albums-outline"
            message="No subcategories yet. Cards can use none, one, or many."
            actionLabel="Add subcategory"
            onAction={openCreateForm}
          />
        }
        renderItem={({ item }) => {
          const cardCount = cardCountBySubcategory[item.id] ?? 0;
          return (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <CardSubcategoryBadge subcategory={item} />
                {cardCount > 0 ? (
                  <Text style={styles.cardCount}>
                    {cardCount} card{cardCount === 1 ? '' : 's'}
                  </Text>
                ) : null}
              </View>
              <View style={styles.rowActions}>
                <Pressable onPress={() => startEdit(item)} hitSlop={8}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </Pressable>
                {cardCount === 0 ? (
                  <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={formVisible}
        animationType="slide"
        transparent
        onRequestClose={closeForm}>
        <Pressable style={styles.backdrop} onPress={closeForm}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation?.()}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingId ? 'Edit subcategory' : 'New subcategory'}
              </Text>
              <Pressable onPress={closeForm} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled">
              <FormField icon="text-outline" title="Name" required>
                <TextInput
                  style={formStyles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Social confidence"
                  placeholderTextColor={colors.textSecondary}
                />
              </FormField>

              <FormField icon="eye-outline" title="Preview">
                <CardSubcategoryBadge subcategory={{ name: name.trim() || 'Preview' }} />
              </FormField>
            </ScrollView>

            <FormActionBar style={styles.sheetActions}>
              <IconButton icon="close" label="Cancel" onPress={closeForm} variant="surface" />
              <SaveButton
                label={editingId ? 'Update' : 'Add'}
                onPress={handleSave}
                loading={isSaving}
              />
            </FormActionBar>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBtn: {
    marginRight: 8,
  },
  list: {
    flexGrow: 1,
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowInfo: {
    flex: 1,
    marginRight: spacing.md,
    gap: spacing.xs,
  },
  cardCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetContent: {
    padding: spacing.screenPadding,
    gap: spacing.fieldGap,
  },
  sheetActions: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
