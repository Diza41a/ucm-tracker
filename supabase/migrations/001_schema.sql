-- UCM Tracker schema (fresh install)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE story_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bg_color TEXT NOT NULL DEFAULT '#4F46E5',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  notes_html TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE story_story_tags (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  story_tag_id UUID NOT NULL REFERENCES story_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (story_id, story_tag_id)
);

CREATE TABLE card_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bg_color TEXT NOT NULL DEFAULT '#4F46E5',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type_id UUID NOT NULL REFERENCES card_types(id) ON DELETE RESTRICT,
  difficulty REAL NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  action TEXT NOT NULL CHECK (char_length(action) <= 100),
  function_purpose TEXT NOT NULL DEFAULT '',
  practice_location_ideas TEXT,
  completed_once BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE card_stories (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, story_id)
);

CREATE TABLE monthly_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  outings_per_week INT NOT NULL CHECK (outings_per_week >= 0 AND outings_per_week <= 14),
  outing_duration_minutes INT NOT NULL CHECK (outing_duration_minutes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month)
);

CREATE TABLE monthly_card_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, year, month, card_id)
);

CREATE TABLE monthly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  content_html TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month)
);

CREATE TABLE log_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  content_html TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE outing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  template_id UUID REFERENCES log_templates(id) ON DELETE RESTRICT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  starred BOOLEAN NOT NULL DEFAULT FALSE,
  content_html TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

CREATE TABLE outing_log_stories (
  log_id UUID NOT NULL REFERENCES outing_logs(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  PRIMARY KEY (log_id, story_id)
);

CREATE TABLE outing_log_cards (
  log_id UUID NOT NULL REFERENCES outing_logs(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  PRIMARY KEY (log_id, card_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_story_tags_user_id ON story_tags(user_id);
CREATE INDEX idx_story_story_tags_story_id ON story_story_tags(story_id);
CREATE INDEX idx_story_story_tags_story_tag_id ON story_story_tags(story_tag_id);
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_outing_logs_user_date ON outing_logs(user_id, log_date);
CREATE INDEX idx_monthly_priorities_user_month ON monthly_card_priorities(user_id, year, month);
CREATE INDEX idx_monthly_reflections_user_month ON monthly_reflections(user_id, year, month);

-- ---------------------------------------------------------------------------
-- Auth triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.seed_default_log_template()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.log_templates (user_id, name, is_default, content_html, sections)
  VALUES (
    NEW.id,
    'Outing Prep & Debrief',
    TRUE,
    $html$
<h2>Before: Setup</h2>
<p><strong>Grab an item(s) from the pool that will last you an hour.</strong></p>
<p><strong>Priority Order:</strong></p>
<ul>
<li>Clear/actionable commitments from Liberation List.</li>
<li>Required items (consistency-based, e.g. initiating conversations with strangers).</li>
<li>Optional/unwind items.</li>
</ul>
<p><strong>Function/Purpose:</strong> What is the core reason for this item(s)?</p>
<p><strong>Stories/Challenges:</strong> Foreseen stories or challenges to rewire (refer to the list)?</p>
<p><strong>Mindset:</strong> Any notes/pep talk for a helpful mindset?</p>
<p><strong>Note: Motivation</strong> - Do I need to do this to compensate/be enough, or do I choose this for a reason?</p>
<p><strong>Tip:</strong> Environment must match your goal. Push intensity just past what you think you can do (5lb -&gt; 10lb, not 5lb -&gt; 25lb).</p>
<br/>
<h2>After: Debrief</h2>
<p><strong>What happened?</strong> What did I do (as if an outside observer)?</p>
<p><strong>How did people respond?</strong></p>
<p><strong>Based on what happened,</strong> what might I conclude about myself? And about how other people respond to me?</p>
<p><strong>OR: After doing the thing, how do I feel?</strong></p>
<p><strong>What will likely happen</strong> if I keep doing this consistently for a period?</p>
<p><strong>Do I need to update notes</strong> for relevant stories/perceptions, or create new ones?</p>
<p><strong>Is there a new identity</strong> I want to choose/reinforce?</p>
<p><strong>What is one win?</strong></p>
$html$,
    '{"sections":[]}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_seed_template
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_log_template();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_story_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_card_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outing_log_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE outing_log_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own story tags" ON story_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own stories" ON stories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own story story tags" ON story_story_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_id AND s.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Users manage own card types" ON card_types
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own cards" ON cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own card stories" ON card_stories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM cards c WHERE c.id = card_id AND c.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM cards c WHERE c.id = card_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users manage own commitments" ON monthly_commitments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own priorities" ON monthly_card_priorities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own monthly reflections" ON monthly_reflections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own log templates" ON log_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own outing logs" ON outing_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own outing log stories" ON outing_log_stories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM outing_logs ol
      WHERE ol.id = log_id AND ol.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM outing_logs ol
      WHERE ol.id = log_id AND ol.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own outing log cards" ON outing_log_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM outing_logs ol
      WHERE ol.id = log_id AND ol.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM outing_logs ol
      WHERE ol.id = log_id AND ol.user_id = auth.uid()
    )
  );
