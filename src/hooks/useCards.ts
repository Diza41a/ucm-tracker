import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { Card, CardSubcategory, Story } from '@/src/types';
import { normalizeStoryFromDb } from '@/src/utils/story';

export const cardKeys = {
  all: ['cards', 'v2'] as const,
  detail: (id: string) => ['cards', 'v2', id] as const,
};

function normalizeStory(story: unknown): Story | null {
  return normalizeStoryFromDb(story);
}

export async function fetchCardSubcategories(cardIds: string[]) {
  if (cardIds.length === 0) return new Map<string, CardSubcategory[]>();

  const { data, error } = await supabase
    .from('card_card_subcategories')
    .select('card_id, subcategory:card_subcategories(*)')
    .in('card_id', cardIds);
  if (error) throw error;

  const byCardId = new Map<string, CardSubcategory[]>();
  data?.forEach((row) => {
    const raw = row.subcategory;
    const subcategory = (Array.isArray(raw) ? raw[0] : raw) as CardSubcategory | null;
    if (!subcategory) return;
    const existing = byCardId.get(row.card_id) ?? [];
    existing.push(subcategory);
    byCardId.set(row.card_id, existing);
  });

  for (const subcategories of byCardId.values()) {
    subcategories.sort((a, b) => a.name.localeCompare(b.name));
  }

  return byCardId;
}

async function fetchCardsWithRelations() {
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*, card_type:card_types(*)')
    .order('updated_at', { ascending: false });
  if (cardsError) throw cardsError;

  const cardIds = (cards as Card[]).map((card) => card.id);
  const [{ data: cardStories, error: csError }, subcategoriesByCardId] = await Promise.all([
    supabase
      .from('card_stories')
      .select('card_id, story:stories(*, story_story_tags(story_tag:story_tags(*)))'),
    fetchCardSubcategories(cardIds),
  ]);
  if (csError) throw csError;

  return (cards as Card[]).map((card) => ({
    ...card,
    completed_once: card.completed_once ?? false,
    stories:
      cardStories
        ?.filter((cs) => cs.card_id === card.id)
        .map((cs) => normalizeStory(cs.story))
        .filter((s): s is Story => s !== null) ?? [],
    subcategories: subcategoriesByCardId.get(card.id) ?? [],
  }));
}

export function useCards() {
  return useQuery({
    queryKey: cardKeys.all,
    queryFn: fetchCardsWithRelations,
    refetchOnMount: 'always',
  });
}

export function useCard(id: string) {
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*, card_type:card_types(*)')
        .eq('id', id)
        .single();
      if (error) throw error;

      const { data: cardStories, error: csError } = await supabase
        .from('card_stories')
        .select('story:stories(*, story_story_tags(story_tag:story_tags(*)))')
        .eq('card_id', id);
      if (csError) throw csError;

      const subcategoriesByCardId = await fetchCardSubcategories([id]);

      return {
        ...data,
        completed_once: data.completed_once ?? false,
        stories:
          cardStories
            ?.map((cs) => normalizeStory(cs.story))
            .filter((s): s is Story => s !== null) ?? [],
        subcategories: subcategoriesByCardId.get(id) ?? [],
      } as Card;
    },
    enabled: !!id && id !== 'new',
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      card_type_id: string;
      difficulty: number;
      action: string;
      function_purpose: string;
      practice_location_ideas?: string | null;
      story_ids: string[];
      subcategory_ids?: string[];
      completed_once?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cards')
        .insert({
          user_id: user.id,
          card_type_id: input.card_type_id,
          difficulty: input.difficulty,
          action: input.action,
          function_purpose: input.function_purpose,
          practice_location_ideas: input.practice_location_ideas ?? null,
          completed_once: input.completed_once ?? false,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.story_ids.length > 0) {
        const { error: linkError } = await supabase.from('card_stories').insert(
          input.story_ids.map((story_id) => ({ card_id: data.id, story_id }))
        );
        if (linkError) throw linkError;
      }

      if (input.subcategory_ids !== undefined) {
        if (input.subcategory_ids.length > 0) {
          const { error: subcategoryError } = await supabase.from('card_card_subcategories').insert(
            input.subcategory_ids.map((subcategory_id) => ({
              card_id: data.id,
              subcategory_id,
            }))
          );
          if (subcategoryError) throw subcategoryError;
        }
      }

      return data as Card;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['enrichedCards'] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      card_type_id: string;
      difficulty: number;
      action: string;
      function_purpose: string;
      practice_location_ideas?: string | null;
      story_ids: string[];
      subcategory_ids?: string[];
      completed_once?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('cards')
        .update({
          card_type_id: input.card_type_id,
          difficulty: input.difficulty,
          action: input.action,
          function_purpose: input.function_purpose,
          practice_location_ideas: input.practice_location_ideas ?? null,
          completed_once: input.completed_once ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('card_stories').delete().eq('card_id', input.id);
      if (input.story_ids.length > 0) {
        const { error: linkError } = await supabase.from('card_stories').insert(
          input.story_ids.map((story_id) => ({ card_id: input.id, story_id }))
        );
        if (linkError) throw linkError;
      }

      if (input.subcategory_ids !== undefined) {
        await supabase.from('card_card_subcategories').delete().eq('card_id', input.id);
        if (input.subcategory_ids.length > 0) {
          const { error: subcategoryError } = await supabase.from('card_card_subcategories').insert(
            input.subcategory_ids.map((subcategory_id) => ({
              card_id: input.id,
              subcategory_id,
            }))
          );
          if (subcategoryError) throw subcategoryError;
        }
      }

      return data as Card;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['enrichedCards'] });
    },
  });
}

export function useUpdateCardTableFields() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      card_type_id?: string;
      action?: string;
      difficulty?: number;
      subcategory_ids?: string[];
    }) => {
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.card_type_id !== undefined) patch.card_type_id = input.card_type_id;
      if (input.action !== undefined) patch.action = input.action;
      if (input.difficulty !== undefined) patch.difficulty = input.difficulty;

      if (
        input.card_type_id !== undefined ||
        input.action !== undefined ||
        input.difficulty !== undefined
      ) {
        const { error } = await supabase.from('cards').update(patch).eq('id', input.id);
        if (error) throw error;
      }

      if (input.subcategory_ids !== undefined) {
        const { error: deleteError } = await supabase
          .from('card_card_subcategories')
          .delete()
          .eq('card_id', input.id);
        if (deleteError) throw deleteError;

        if (input.subcategory_ids.length > 0) {
          const { error: insertError } = await supabase.from('card_card_subcategories').insert(
            input.subcategory_ids.map((subcategory_id) => ({
              card_id: input.id,
              subcategory_id,
            }))
          );
          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(input.id) });
      queryClient.invalidateQueries({ queryKey: ['enrichedCards'] });
    },
  });
}

export function useToggleCardCompletedOnce() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; completed_once: boolean }) => {
      const { data, error } = await supabase
        .from('cards')
        .update({
          completed_once: input.completed_once,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as Card;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['enrichedCards'] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from('card_stories')
        .select('story_id', { count: 'exact', head: true })
        .eq('card_id', id);

      if (countError) throw countError;
      if (count && count > 0) {
        throw new Error(
          `This card is linked to ${count} stor${count === 1 ? 'y' : 'ies'}. Remove it from those stories first.`
        );
      }

      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['enrichedCards'] });
    },
  });
}
