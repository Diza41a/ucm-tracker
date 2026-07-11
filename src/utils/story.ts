import type { Story, StoryTag } from '@/src/types';

type StoryStoryTagRow = { story_tag: StoryTag | StoryTag[] | null };

type RawStory = Omit<Story, 'story_tags'> & {
  story_tag_id?: string | null;
  story_tag?: StoryTag | null;
  story_story_tags?: StoryStoryTagRow[] | null;
};

function normalizeStoryTag(tag: unknown): StoryTag | null {
  if (!tag || Array.isArray(tag)) return null;
  return tag as StoryTag;
}

export function normalizeStoryFromDb(raw: unknown): Story | null {
  if (!raw || Array.isArray(raw)) return null;

  const story = raw as RawStory;
  const { story_story_tags, story_tag_id: _storyTagId, story_tag, ...rest } = story;

  let story_tags: StoryTag[] = [];
  if (story_story_tags?.length) {
    story_tags = story_story_tags
      .map((row) => normalizeStoryTag(row.story_tag))
      .filter((tag): tag is StoryTag => tag !== null);
  } else if (story_tag) {
    story_tags = [story_tag];
  }

  return { ...rest, story_tags };
}
