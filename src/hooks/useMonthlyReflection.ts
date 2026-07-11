import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { MonthlyReflection } from '@/src/types';

export const reflectionKeys = {
  month: (year: number, month: number) => ['monthlyReflection', year, month] as const,
};

export function useMonthlyReflection(year: number, month: number) {
  return useQuery({
    queryKey: reflectionKeys.month(year, month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_reflections')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        content_html: data.content_html ?? '',
      } as MonthlyReflection;
    },
    placeholderData: keepPreviousData,
  });
}

export function useUpsertMonthlyReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      year: number;
      month: number;
      content_html: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('monthly_reflections')
        .upsert(
          {
            user_id: user.id,
            year: input.year,
            month: input.month,
            content_html: input.content_html,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,year,month' }
        )
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        content_html: data.content_html ?? '',
      } as MonthlyReflection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: reflectionKeys.month(data.year, data.month),
      });
    },
  });
}
