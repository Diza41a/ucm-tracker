import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { ColorPickerField } from '@/src/components/ui/ColorPickerField';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { IconButton } from '@/src/components/ui/IconButton';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { colors, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import {
  useCardTypes,
  useCreateCardType,
  useDeleteCardType,
  useUpdateCardType,
} from '@/src/hooks/useCardTypes';
import { useCards } from '@/src/hooks/useCards';
import { isValidHexColor } from '@/src/utils/color';

const DEFAULT_BG_COLOR = colors.primary;
const DEFAULT_TEXT_COLOR = '#FFFFFF';

export default function CardTypesScreen() {
  const { data: cardTypes, isLoading, error, refetch } = useCardTypes();
  const { data: cards } = useCards();
  const createType = useCreateCardType();
  const updateType = useUpdateCardType();
  const deleteType = useDeleteCardType();

  const [name, setName] = useState('');
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);

  const cardCountByType = useMemo(() => {
    const counts: Record<string, number> = {};
    cards?.forEach((card) => {
      counts[card.card_type_id] = (counts[card.card_type_id] ?? 0) + 1;
    });
    return counts;
  }, [cards]);

  const resetForm = () => {
    setName('');
    setBgColor(DEFAULT_BG_COLOR);
    setTextColor(DEFAULT_TEXT_COLOR);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    if (!isValidHexColor(bgColor) || !isValidHexColor(textColor)) {
      Alert.alert('Validation', 'Background and text colors must be valid hex values.');
      return;
    }

    const payload = {
      name: name.trim(),
      bg_color: bgColor,
      text_color: textColor,
    };

    try {
      if (editingId) {
        await updateType.mutateAsync({ id: editingId, ...payload });
      } else {
        await createType.mutateAsync(payload);
      }
      resetForm();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const startEdit = (type: NonNullable<typeof cardTypes>[number]) => {
    setEditingId(type.id);
    setName(type.name);
    setBgColor(type.bg_color);
    setTextColor(type.text_color);
  };

  const handleDelete = (id: string) => {
    const cardCount = cardCountByType[id] ?? 0;
    if (cardCount > 0) {
      Alert.alert(
        'Cannot delete',
        `This type is used by ${cardCount} card${cardCount === 1 ? '' : 's'}. Delete or reassign those cards first.`
      );
      return;
    }

    Alert.alert('Delete card type', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteType.mutateAsync(id);
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
      <View style={styles.form}>
        <Text style={styles.formTitle}>{editingId ? 'Edit type' : 'New card type'}</Text>

        <View style={styles.formFields}>
          <FormField icon="text-outline" title="Name" required>
            <TextInput
              style={formStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Required"
              placeholderTextColor={colors.textSecondary}
            />
          </FormField>

          <FormField icon="color-fill-outline" title="Background color">
            <ColorPickerField label="Background" value={bgColor} onChange={setBgColor} />
          </FormField>

          <FormField icon="text-outline" title="Text color">
            <ColorPickerField label="Text" value={textColor} onChange={setTextColor} />
          </FormField>

          <FormField icon="eye-outline" title="Preview">
            <CardBadge
              cardType={{
                name: name.trim() || 'Preview',
                bg_color: bgColor,
                text_color: textColor,
              }}
            />
          </FormField>
        </View>

        <FormActionBar>
          {editingId ? (
            <IconButton icon="close" label="Cancel" onPress={resetForm} variant="surface" />
          ) : null}
          <SaveButton
            label={editingId ? 'Update' : 'Add'}
            onPress={handleSave}
          />
        </FormActionBar>
      </View>

      <FlatList
        data={cardTypes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="No card types yet. Add one above." />}
        renderItem={({ item }) => {
          const cardCount = cardCountByType[item.id] ?? 0;
          return (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <CardBadge cardType={item} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: spacing.screenPadding,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.fieldGap,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  formFields: {
    gap: spacing.fieldGap,
  },
  list: {
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
});
