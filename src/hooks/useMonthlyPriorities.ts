import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/lib/supabase';
import type { MonthlyCardPriority } from '@/src/types';

export const priorityKeys = {
  month: (year: number, month: number) => ['priorities', year, month] as const,
};

export function useMonthlyPriorities(year: number, month: number) {
  return useQuery({
    queryKey: priorityKeys.month(year, month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_card_priorities')
        .select('*, card:cards(*, card_type:card_types(*))')
        .eq('year', year)
        .eq('month', month)
        .order('sort_order');
      if (error) throw error;
      return data as MonthlyCardPriority[];
    },
    placeholderData: keepPreviousData,
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
        .select('*, card:cards(*, card_type:card_types(*))');
      if (error) throw error;
      return data as MonthlyCardPriority[];
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        priorityKeys.month(variables.year, variables.month),
        data
      );
    },
  });
}
