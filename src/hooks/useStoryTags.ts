import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { StoryTag } from '@/src/types';

export const storyTagKeys = {
  all: ['storyTags'] as const,
};

export type StoryTagInput = {
  name: string;
  bg_color: string;
  text_color: string;
};

export function useStoryTags() {
  return useQuery({
    queryKey: storyTagKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_tags')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as StoryTag[];
    },
  });
}

export function useCreateStoryTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StoryTagInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('story_tags')
        .insert({ user_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as StoryTag;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyTagKeys.all }),
  });
}

export function useUpdateStoryTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StoryTagInput & { id: string }) => {
      const { id, ...payload } = input;
      const { data, error } = await supabase
        .from('story_tags')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as StoryTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyTagKeys.all });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useDeleteStoryTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from('story_story_tags')
        .select('story_id', { count: 'exact', head: true })
        .eq('story_tag_id', id);

      if (countError) throw countError;
      if (count && count > 0) {
        throw new Error(
          `This tag is used by ${count} stor${count === 1 ? 'y' : 'ies'}. Remove it from those stories first.`
        );
      }

      const { error } = await supabase.from('story_tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyTagKeys.all }),
  });
}
