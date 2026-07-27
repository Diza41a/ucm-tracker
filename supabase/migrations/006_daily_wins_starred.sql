ALTER TABLE daily_wins
  ADD COLUMN starred BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_daily_wins_user_starred ON daily_wins(user_id, starred, win_date);
