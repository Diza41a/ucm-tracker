import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { Card, OutingLog, Story } from '@/src/types';
import { normalizeStoryFromDb } from '@/src/utils/story';

export const outingLogKeys = {
  all: ['outingLogs'] as const,
  month: (year: number, month: number) => ['outingLogs', year, month] as const,
  date: (date: string) => ['outingLogs', 'date', date] as const,
  starred: ['outingLogs', 'starred'] as const,
};

function normalizeStory(story: unknown): Story | null {
  return normalizeStoryFromDb(story);
}

function normalizeCard(card: unknown): Card | null {
  if (!card || Array.isArray(card)) return null;
  return card as Card;
}

async function attachRelationsToLog(log: OutingLog): Promise<OutingLog> {
  const [{ data: logStories, error: storiesError }, { data: logCards, error: cardsError }] =
    await Promise.all([
      supabase.from('outing_log_stories').select('story:stories(*, story_story_tags(story_tag:story_tags(*)))').eq('log_id', log.id),
      supabase
        .from('outing_log_cards')
        .select('card:cards(*, card_type:card_types(*))')
        .eq('log_id', log.id),
    ]);

  if (storiesError) throw storiesError;
  if (cardsError) throw cardsError;

  return {
    ...log,
    content_html: log.content_html ?? '',
    stories:
      logStories
        ?.map((row) => normalizeStory(row.story))
        .filter((s): s is Story => s !== null) ?? [],
    cards:
      logCards
        ?.map((row) => normalizeCard(row.card))
        .filter((c): c is Card => c !== null) ?? [],
  };
}

export function useOutingLogsForMonth(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  return useQuery({
    queryKey: outingLogKeys.month(year, month),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outing_logs')
        .select('*')
        .gte('log_date', startDate)
        .lt('log_date', endDate)
        .order('log_date');
      if (error) throw error;
      return (data as OutingLog[]).map((log) => ({
        ...log,
        content_html: log.content_html ?? '',
      }));
    },
    placeholderData: keepPreviousData,
  });
}

export function useOutingLogByDate(date: string) {
  return useQuery({
    queryKey: outingLogKeys.date(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outing_logs')
        .select('*, template:log_templates(*)')
        .eq('log_date', date)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return attachRelationsToLog({
        ...data,
        content_html: data.content_html ?? '',
      } as OutingLog);
    },
    enabled: !!date,
  });
}

export function useStarredOutingLogs() {
  return useQuery({
    queryKey: outingLogKeys.starred,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outing_logs')
        .select('*, template:log_templates(*)')
        .eq('starred', true)
        .order('log_date', { ascending: false });
      if (error) throw error;
      return (data as OutingLog[]).map((log) => ({
        ...log,
        content_html: log.content_html ?? '',
      }));
    },
  });
}

export function useUpsertOutingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      log_date: string;
      template_id?: string | null;
      completed?: boolean;
      starred?: boolean;
      content_html?: string;
      story_ids?: string[];
      card_ids?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('outing_logs')
        .upsert(
          {
            user_id: user.id,
            log_date: input.log_date,
            template_id: input.template_id ?? null,
            completed: input.completed ?? false,
            starred: input.starred ?? false,
            content_html: input.content_html ?? '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,log_date' }
        )
        .select('*, template:log_templates(*)')
        .single();
      if (error) throw error;

      if (input.story_ids !== undefined) {
        await supabase.from('outing_log_stories').delete().eq('log_id', data.id);
        if (input.story_ids.length > 0) {
          const { error: linkError } = await supabase.from('outing_log_stories').insert(
            input.story_ids.map((story_id) => ({ log_id: data.id, story_id }))
          );
          if (linkError) throw linkError;
        }
      }

      if (input.card_ids !== undefined) {
        await supabase.from('outing_log_cards').delete().eq('log_id', data.id);
        if (input.card_ids.length > 0) {
          const { error: linkError } = await supabase.from('outing_log_cards').insert(
            input.card_ids.map((card_id) => ({ log_id: data.id, card_id }))
          );
          if (linkError) throw linkError;
        }
      }

      return attachRelationsToLog({
        ...data,
        content_html: data.content_html ?? '',
      } as OutingLog);
    },
    onMutate: async (input) => {
      const date = new Date(input.log_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      await queryClient.cancelQueries({ queryKey: outingLogKeys.date(input.log_date) });

      const previous = queryClient.getQueryData<OutingLog | null>(
        outingLogKeys.date(input.log_date)
      );

      const optimistic: OutingLog = {
        id: previous?.id ?? 'temp',
        user_id: previous?.user_id ?? '',
        log_date: input.log_date,
        template_id: input.template_id ?? previous?.template_id ?? null,
        completed: input.completed ?? previous?.completed ?? false,
        starred: input.starred ?? previous?.starred ?? false,
        content_html: input.content_html ?? previous?.content_html ?? '',
        created_at: previous?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stories: previous?.stories,
        cards: previous?.cards,
      };

      queryClient.setQueryData(outingLogKeys.date(input.log_date), optimistic);

      const monthLogs = queryClient.getQueryData<OutingLog[]>(
        outingLogKeys.month(year, month)
      );
      if (monthLogs) {
        const updated = monthLogs.some((l) => l.log_date === input.log_date)
          ? monthLogs.map((l) =>
              l.log_date === input.log_date ? { ...l, ...optimistic } : l
            )
          : [...monthLogs, optimistic];
        queryClient.setQueryData(outingLogKeys.month(year, month), updated);
      }

      return { previous, year, month };
    },
    onError: (_err, input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(outingLogKeys.date(input.log_date), context.previous);
      }
    },
    onSettled: (data) => {
      if (!data) return;
      const date = new Date(data.log_date);
      queryClient.invalidateQueries({
        queryKey: outingLogKeys.month(date.getFullYear(), date.getMonth() + 1),
      });
      queryClient.invalidateQueries({ queryKey: outingLogKeys.date(data.log_date) });
      queryClient.invalidateQueries({ queryKey: outingLogKeys.starred });
    },
  });
}

export function useDeleteOutingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log_date: string) => {
      const { error } = await supabase
        .from('outing_logs')
        .delete()
        .eq('log_date', log_date);
      if (error) throw error;
    },
    onSuccess: (_, log_date) => {
      const date = new Date(log_date);
      queryClient.invalidateQueries({
        queryKey: outingLogKeys.month(date.getFullYear(), date.getMonth() + 1),
      });
      queryClient.invalidateQueries({ queryKey: outingLogKeys.date(log_date) });
      queryClient.invalidateQueries({ queryKey: outingLogKeys.starred });
    },
  });
}
