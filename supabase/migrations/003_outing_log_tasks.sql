CREATE TABLE outing_log_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES outing_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outing_log_tasks_log ON outing_log_tasks(log_id, sort_order);

ALTER TABLE outing_log_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own outing log tasks" ON outing_log_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
