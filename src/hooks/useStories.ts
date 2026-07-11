import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { Story } from '@/src/types';
import { normalizeStoryFromDb } from '@/src/utils/story';

export const storyKeys = {
  all: ['stories'] as const,
  detail: (id: string) => ['stories', id] as const,
};

const STORY_SELECT = '*, story_story_tags(story_tag:story_tags(*))';

async function syncStoryTags(storyId: string, tagIds: string[]) {
  const { error: deleteError } = await supabase
    .from('story_story_tags')
    .delete()
    .eq('story_id', storyId);
  if (deleteError) throw deleteError;

  if (tagIds.length > 0) {
    const { error: insertError } = await supabase.from('story_story_tags').insert(
      tagIds.map((story_tag_id) => ({ story_id: storyId, story_tag_id }))
    );
    if (insertError) throw insertError;
  }
}

async function fetchStoryById(id: string): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;

  const story = normalizeStoryFromDb(data);
  if (!story) throw new Error('Failed to load story');
  return story;
}

export function useStories() {
  return useQuery({
    queryKey: storyKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select(STORY_SELECT)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((row) => normalizeStoryFromDb(row))
        .filter((story): story is Story => story !== null);
    },
  });
}

export function useStory(id: string) {
  return useQuery({
    queryKey: storyKeys.detail(id),
    queryFn: () => fetchStoryById(id),
    enabled: !!id && id !== 'new',
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      story_tag_ids?: string[];
      notes_html?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          name: input.name,
          notes_html: input.notes_html ?? '',
        })
        .select('id')
        .single();
      if (error) throw error;

      await syncStoryTags(data.id, input.story_tag_ids ?? []);
      return fetchStoryById(data.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      story_tag_ids?: string[];
      notes_html?: string;
    }) => {
      const { error } = await supabase
        .from('stories')
        .update({
          name: input.name,
          notes_html: input.notes_html ?? '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id);
      if (error) throw error;

      await syncStoryTags(input.id, input.story_tag_ids ?? []);
      return fetchStoryById(input.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
      queryClient.invalidateQueries({ queryKey: storyKeys.detail(data.id) });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.removeQueries({ queryKey: storyKeys.detail(id) });
    },
  });
}

export async function fetchStoryCardLinkCount(storyId: string) {
  const { count, error } = await supabase
    .from('card_stories')
    .select('card_id', { count: 'exact', head: true })
    .eq('story_id', storyId);

  if (error) throw error;
  return count ?? 0;
}
