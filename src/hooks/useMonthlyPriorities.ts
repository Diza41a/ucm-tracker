import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchCardSubcategories, fetchCardTypes } from '@/src/hooks/useCards';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/lib/supabase';
import type { Card, MonthlyCardPriority } from '@/src/types';
import { attachCardTypes } from '@/src/utils/cardTypes';

async function enrichPrioritiesWithCardRelations(priorities: MonthlyCardPriority[]) {
  const cardIds = priorities
    .map((priority) => priority.card?.id)
    .filter((id): id is string => !!id);

  if (cardIds.length === 0) return priorities;

  const [subcategoriesByCardId, typesByCardId] = await Promise.all([
    fetchCardSubcategories(cardIds),
    fetchCardTypes(cardIds),
  ]);

  return priorities.map((priority) => {
    if (!priority.card) return priority;

    const subcategories = subcategoriesByCardId.get(priority.card.id) ?? [];
    const cardTypes = typesByCardId.get(priority.card.id) ?? [];

    return {
      ...priority,
      card: attachCardTypes(
        {
          ...(priority.card as Card),
          subcategories,
        },
        cardTypes
      ),
    };
  });
}

export const priorityKeys = {
  month: (year: number, month: number) => ['priorities', 'v2', year, month] as const,
};

export function useMonthlyPriorities(year: number, month: number) {
  return useQuery({
    queryKey: priorityKeys.month(year, month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_card_priorities')
        .select('*, card:cards(*)')
        .eq('year', year)
        .eq('month', month)
        .order('sort_order');
      if (error) throw error;
      return enrichPrioritiesWithCardRelations(data as MonthlyCardPriority[]);
    },
  });
}

export function useSaveMonthlyPriorities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      year: number;
      month: number;
      cardIds: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('monthly_card_priorities')
        .delete()
        .eq('year', input.year)
        .eq('month', input.month);

      if (input.cardIds.length === 0) return [];

      const rows = input.cardIds.map((card_id, index) => ({
        user_id: user.id,
        year: input.year,
        month: input.month,
        card_id,
        sort_order: index,
      }));

      const { data, error } = await supabase
        .from('monthly_card_priorities')
        .insert(rows)
        .select('*, card:cards(*)');
      if (error) throw error;
      return enrichPrioritiesWithCardRelations(data as MonthlyCardPriority[]);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        priorityKeys.month(variables.year, variables.month),
        data
      );
    },
  });
}
