CREATE TABLE monthly_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  content_html TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month)
);

CREATE INDEX idx_monthly_notes_user_month ON monthly_notes(user_id, year, month);

ALTER TABLE monthly_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own monthly notes" ON monthly_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
