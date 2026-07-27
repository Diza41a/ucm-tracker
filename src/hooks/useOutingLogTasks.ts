import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { OutingLog, OutingLogTask } from '@/src/types';
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
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = outingLogKeys.month(year, month);
      const monthLogs = queryClient.getQueryData<OutingLog[]>(monthKey);

      if (monthLogs) {
        const hasLog = monthLogs.some((log) => log.log_date === variables.log_date);
        if (hasLog) {
          queryClient.setQueryData(
            monthKey,
            monthLogs.map((log) =>
              log.log_date === variables.log_date ? { ...log, tasks: data } : log
            )
          );
        } else {
          const dateLog = queryClient.getQueryData<OutingLog | null>(
            outingLogKeys.date(variables.log_date)
          );
          if (dateLog) {
            queryClient.setQueryData(monthKey, [...monthLogs, { ...dateLog, tasks: data }]);
          } else {
            queryClient.invalidateQueries({ queryKey: monthKey });
          }
        }
      } else {
        queryClient.invalidateQueries({ queryKey: monthKey });
      }
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
    .filter((task) => task.title.trim().length > 0)
    .map((task) => `${task.id}:${task.title.trim()}:${task.completed}`)
    .join('|');
}

function emptyDraftTasks(tasks: OutingLogTask[]) {
  return tasks.filter((task) => task.title.trim().length === 0);
}

function mergeSavedWithDrafts(saved: OutingLogTask[], local: OutingLogTask[]) {
  return [...saved, ...emptyDraftTasks(local)];
}

function shouldPersistTasks(nextTasks: OutingLogTask[], lastSavedSnapshot: string) {
  const savableTasks = nextTasks.filter((task) => task.title.trim().length > 0);
  const snapshot = tasksSnapshot(savableTasks);
  if (snapshot === lastSavedSnapshot) return false;

  // Empty draft rows must never wipe saved tasks on the server.
  if (savableTasks.length === 0 && emptyDraftTasks(nextTasks).length > 0) {
    return false;
  }

  return true;
}

export { emptyDraftTasks, mergeSavedWithDrafts, shouldPersistTasks };
