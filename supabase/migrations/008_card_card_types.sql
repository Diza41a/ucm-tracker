CREATE TABLE IF NOT EXISTS card_card_types (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  card_type_id UUID NOT NULL REFERENCES card_types(id) ON DELETE RESTRICT,
  PRIMARY KEY (card_id, card_type_id)
);

CREATE INDEX IF NOT EXISTS idx_card_card_types_card_id ON card_card_types(card_id);
CREATE INDEX IF NOT EXISTS idx_card_card_types_card_type_id ON card_card_types(card_type_id);

INSERT INTO card_card_types (card_id, card_type_id)
SELECT id, card_type_id
FROM cards
ON CONFLICT (card_id, card_type_id) DO NOTHING;

ALTER TABLE card_card_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'card_card_types'
      AND policyname = 'Users manage own card card types'
  ) THEN
    CREATE POLICY "Users manage own card card types" ON card_card_types
      FOR ALL USING (
        EXISTS (SELECT 1 FROM cards c WHERE c.id = card_id AND c.user_id = auth.uid())
      ) WITH CHECK (
        EXISTS (SELECT 1 FROM cards c WHERE c.id = card_id AND c.user_id = auth.uid())
      );
  END IF;
END $$;
