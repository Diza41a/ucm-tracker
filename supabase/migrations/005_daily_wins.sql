CREATE TABLE daily_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  win_date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, win_date)
);

CREATE INDEX idx_daily_wins_user_date ON daily_wins(user_id, win_date);

ALTER TABLE daily_wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily wins" ON daily_wins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
