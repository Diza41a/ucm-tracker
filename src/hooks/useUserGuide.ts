import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_USER_GUIDE_HTML } from '@/src/constants/defaultUserGuide';
import { supabase } from '@/src/lib/supabase';
import type { UserGuide } from '@/src/types';

export const userGuideKeys = {
  all: ['userGuide'] as const,
};

function normalizeUserGuide(data: UserGuide): UserGuide {
  return {
    ...data,
    content_html: data.content_html ?? '',
  };
}

export function useUserGuide() {
  return useQuery({
    queryKey: userGuideKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_guides').select('*').maybeSingle();
      if (error) throw error;
      if (data) return normalizeUserGuide(data as UserGuide);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: created, error: insertError } = await supabase
        .from('user_guides')
        .insert({
          user_id: user.id,
          content_html: DEFAULT_USER_GUIDE_HTML,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      return normalizeUserGuide(created as UserGuide);
    },
  });
}

export function useUpsertUserGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { content_html: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_guides')
        .upsert(
          {
            user_id: user.id,
            content_html: input.content_html,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return normalizeUserGuide(data as UserGuide);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userGuideKeys.all, data);
    },
  });
}
