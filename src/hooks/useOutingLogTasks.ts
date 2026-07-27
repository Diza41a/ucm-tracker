import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { OutingLogTask } from '@/src/types';
import { outingLogKeys } from '@/src/hooks/useOutingLogs';

export const outingLogTaskKeys = {
  date: (date: string) => ['outingLogTasks', date] as const,
};

export type OutingLogTaskInput = {
  id?: string;
  title: string;
  completed: boolean;
  sort_order: number;
};

async function ensureLogId(
  logDate: string,
  userId: string,
  templateId?: string | null
): Promise<string> {
  const { data: existing, error: existingError } = await supabase
    .from('outing_logs')
    .select('id, template_id, completed, starred, content_html')
    .eq('log_date', logDate)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('outing_logs')
    .insert({
      user_id: userId,
      log_date: logDate,
      template_id: templateId ?? null,
      completed: false,
      starred: false,
      content_html: '',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export function useSaveOutingLogTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      log_date: string;
      template_id?: string | null;
      tasks: OutingLogTaskInput[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const logId = await ensureLogId(input.log_date, user.id, input.template_id);

      await supabase.from('outing_log_tasks').delete().eq('log_id', logId);

      const tasks = input.tasks.filter((task) => task.title.trim().length > 0);
      if (tasks.length > 0) {
        const { data, error } = await supabase
          .from('outing_log_tasks')
          .insert(
            tasks.map((task, index) => ({
              log_id: logId,
              user_id: user.id,
              title: task.title.trim(),
              completed: task.completed,
              sort_order: index,
            }))
          )
          .select('*')
          .order('sort_order');
        if (error) throw error;
        return data as OutingLogTask[];
      }

      return [] as OutingLogTask[];
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(outingLogTaskKeys.date(variables.log_date), data);

      const existingLog = queryClient.getQueryData<{ tasks?: OutingLogTask[] } | null>(
        outingLogKeys.date(variables.log_date)
      );
      if (existingLog) {
        queryClient.setQueryData(outingLogKeys.date(variables.log_date), {
          ...existingLog,
          tasks: data,
        });
      }

      const date = new Date(variables.log_date);
      queryClient.invalidateQueries({
        queryKey: outingLogKeys.month(date.getFullYear(), date.getMonth() + 1),
      });
      queryClient.invalidateQueries({
        queryKey: outingLogKeys.date(variables.log_date),
      });
    },
  });
}

export function createTempTask(title = ''): OutingLogTask {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    log_id: '',
    user_id: '',
    title,
    sort_order: 0,
    completed: false,
    created_at: '',
    updated_at: '',
  };
}

export function tasksSnapshot(tasks: OutingLogTask[]) {
  return tasks
    .map((task) => `${task.id}:${task.title}:${task.completed}`)
    .join('|');
}
