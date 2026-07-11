import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  DEFAULT_LOG_TEMPLATE_HTML,
  DEFAULT_LOG_TEMPLATE_NAME,
} from '@/src/constants/defaultLogTemplate';
import { supabase } from '@/src/lib/supabase';
import type { LogTemplate } from '@/src/types';

export const logTemplateKeys = {
  all: ['logTemplates'] as const,
  detail: (id: string) => ['logTemplates', id] as const,
};

export function useLogTemplates() {
  return useQuery({
    queryKey: logTemplateKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('log_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');
      if (error) throw error;
      return (data as LogTemplate[]).map((t) => ({
        ...t,
        content_html: t.content_html ?? '',
      }));
    },
  });
}

export function useLogTemplate(id: string) {
  return useQuery({
    queryKey: logTemplateKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('log_templates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { ...data, content_html: data.content_html ?? '' } as LogTemplate;
    },
    enabled: !!id && id !== 'new',
  });
}

export function useEnsureDefaultTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: existing, error: fetchError } = await supabase
        .from('log_templates')
        .select('id')
        .limit(1);
      if (fetchError) throw fetchError;
      if (existing && existing.length > 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('log_templates').insert({
        user_id: user.id,
        name: DEFAULT_LOG_TEMPLATE_NAME,
        is_default: true,
        content_html: DEFAULT_LOG_TEMPLATE_HTML,
        sections: { sections: [] },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logTemplateKeys.all });
    },
  });
}

export function useCreateLogTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      content_html: string;
      is_default?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (input.is_default) {
        await supabase
          .from('log_templates')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('log_templates')
        .insert({
          user_id: user.id,
          name: input.name,
          content_html: input.content_html,
          sections: { sections: [] },
          is_default: input.is_default ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as LogTemplate;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logTemplateKeys.all }),
  });
}

export function useUpdateLogTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      content_html: string;
      is_default?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (input.is_default) {
        await supabase
          .from('log_templates')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('log_templates')
        .update({
          name: input.name,
          content_html: input.content_html,
          is_default: input.is_default ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as LogTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: logTemplateKeys.all });
      queryClient.invalidateQueries({ queryKey: logTemplateKeys.detail(data.id) });
    },
  });
}

export function useDeleteLogTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('log_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logTemplateKeys.all }),
  });
}

export function useSetDefaultLogTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('log_templates')
        .update({ is_default: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('log_templates')
        .update({ is_default: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logTemplateKeys.all }),
  });
}
