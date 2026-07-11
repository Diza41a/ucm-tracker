export interface StoryTag {
  id: string;
  user_id: string;
  name: string;
  bg_color: string;
  text_color: string;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  name: string;
  notes_html: string;
  created_at: string;
  updated_at: string;
  story_tags?: StoryTag[];
}

export interface CardType {
  id: string;
  user_id: string;
  name: string;
  bg_color: string;
  text_color: string;
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  card_type_id: string;
  difficulty: number;
  action: string;
  function_purpose: string;
  practice_location_ideas: string | null;
  completed_once: boolean;
  created_at: string;
  updated_at: string;
  card_type?: CardType;
  stories?: Story[];
}

export interface MonthlyCommitment {
  id: string;
  user_id: string;
  year: number;
  month: number;
  outings_per_week: number;
  outing_duration_minutes: number;
  created_at: string;
}

export interface MonthlyCardPriority {
  id: string;
  user_id: string;
  year: number;
  month: number;
  card_id: string;
  sort_order: number;
  card?: Card;
}

export interface LogTemplate {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  content_html: string;
  created_at: string;
  updated_at: string;
}

export interface OutingLog {
  id: string;
  user_id: string;
  log_date: string;
  template_id: string | null;
  completed: boolean;
  starred: boolean;
  content_html: string;
  created_at: string;
  updated_at: string;
  template?: LogTemplate;
  stories?: Story[];
  cards?: Card[];
}

export interface MonthlyReflection {
  id: string;
  user_id: string;
  year: number;
  month: number;
  content_html: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
}
