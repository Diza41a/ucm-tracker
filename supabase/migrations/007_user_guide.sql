CREATE TABLE user_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  content_html TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_guides_user_id ON user_guides(user_id);

ALTER TABLE user_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own user guide" ON user_guides
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
