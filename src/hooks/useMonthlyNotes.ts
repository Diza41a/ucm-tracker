import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { MonthlyNotes } from '@/src/types';

export const notesKeys = {
  month: (year: number, month: number) => ['monthlyNotes', year, month] as const,
};

export function useMonthlyNotes(year: number, month: number) {
  return useQuery({
    queryKey: notesKeys.month(year, month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_notes')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        content_html: data.content_html ?? '',
      } as MonthlyNotes;
    },
    placeholderData: keepPreviousData,
  });
}

export function useUpsertMonthlyNotes() {
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
        .from('monthly_notes')
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
      } as MonthlyNotes;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(notesKeys.month(data.year, data.month), data);
    },
  });
}
