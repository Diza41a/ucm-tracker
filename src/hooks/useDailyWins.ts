import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { DailyWin } from '@/src/types';

export const dailyWinKeys = {
  month: (year: number, month: number) => ['dailyWins', year, month] as const,
};

function normalizeDailyWin(win: DailyWin): DailyWin {
  return {
    ...win,
    content: win.content ?? '',
    starred: win.starred ?? false,
  };
}

function monthKeyFromDate(winDate: string) {
  const [yearStr, monthStr] = winDate.split('-');
  return dailyWinKeys.month(Number(yearStr), Number(monthStr));
}

function sortDailyWins(wins: DailyWin[]) {
  return [...wins].sort((a, b) => {
    if (a.starred !== b.starred) {
      return a.starred ? -1 : 1;
    }
    return b.win_date.localeCompare(a.win_date);
  });
}

function patchMonthCache(
  queryClient: ReturnType<typeof useQueryClient>,
  winDate: string,
  updater: (wins: DailyWin[]) => DailyWin[]
) {
  queryClient.setQueryData<DailyWin[]>(monthKeyFromDate(winDate), (current) =>
    sortDailyWins(updater(current ?? []))
  );
}

export function useDailyWinsForMonth(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  return useQuery({
    queryKey: dailyWinKeys.month(year, month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_wins')
        .select('*')
        .gte('win_date', startDate)
        .lt('win_date', endDate)
        .order('starred', { ascending: false })
        .order('win_date', { ascending: false });
      if (error) throw error;
      return sortDailyWins((data as DailyWin[]).map(normalizeDailyWin));
    },
    placeholderData: keepPreviousData,
  });
}

export function useUpsertDailyWin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { win_date: string; content: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const trimmed = input.content.trim();
      if (!trimmed) {
        const { error } = await supabase
          .from('daily_wins')
          .delete()
          .eq('user_id', user.id)
          .eq('win_date', input.win_date);
        if (error) throw error;
        return null;
      }

      const { data: existing } = await supabase
        .from('daily_wins')
        .select('starred')
        .eq('user_id', user.id)
        .eq('win_date', input.win_date)
        .maybeSingle();

      const { data, error } = await supabase
        .from('daily_wins')
        .upsert(
          {
            user_id: user.id,
            win_date: input.win_date,
            content: trimmed,
            starred: existing?.starred ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,win_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return normalizeDailyWin(data as DailyWin);
    },
    onSuccess: (data, variables) => {
      patchMonthCache(queryClient, variables.win_date, (existing) => {
        const withoutDate = existing.filter((win) => win.win_date !== variables.win_date);
        if (!data) return withoutDate;
        return [...withoutDate, data];
      });
    },
  });
}

export function useToggleDailyWinStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { win_date: string; starred: boolean }) => {
      const { data, error } = await supabase
        .from('daily_wins')
        .update({
          starred: input.starred,
          updated_at: new Date().toISOString(),
        })
        .eq('win_date', input.win_date)
        .select()
        .single();
      if (error) throw error;
      return normalizeDailyWin(data as DailyWin);
    },
    onSuccess: (data) => {
      patchMonthCache(queryClient, data.win_date, (existing) => {
        const withoutDate = existing.filter((win) => win.win_date !== data.win_date);
        return [...withoutDate, data];
      });
    },
  });
}
