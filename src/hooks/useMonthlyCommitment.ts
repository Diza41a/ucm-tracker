import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { MonthlyCommitment } from '@/src/types';

export const commitmentKeys = {
  month: (year: number, month: number) => ['commitment', year, month] as const,
};

export function useMonthlyCommitment(year: number, month: number) {
  return useQuery({
    queryKey: commitmentKeys.month(year, month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_commitments')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();
      if (error) throw error;
      return data as MonthlyCommitment | null;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateMonthlyCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      year: number;
      month: number;
      outings_per_week: number;
      outing_duration_minutes: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing, error: existingError } = await supabase
        .from('monthly_commitments')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', input.year)
        .eq('month', input.month)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) {
        throw new Error('Monthly commitment is already set for this month and cannot be changed.');
      }

      const { data, error } = await supabase
        .from('monthly_commitments')
        .insert({ user_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as MonthlyCommitment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: commitmentKeys.month(data.year, data.month),
      });
    },
  });
}
