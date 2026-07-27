CREATE TABLE card_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE card_card_subcategories (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES card_subcategories(id) ON DELETE RESTRICT,
  PRIMARY KEY (card_id, subcategory_id)
);

CREATE INDEX idx_card_subcategories_user_id ON card_subcategories(user_id);
CREATE INDEX idx_card_card_subcategories_card_id ON card_card_subcategories(card_id);
CREATE INDEX idx_card_card_subcategories_subcategory_id ON card_card_subcategories(subcategory_id);

ALTER TABLE card_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_card_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own card subcategories" ON card_subcategories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own card card subcategories" ON card_card_subcategories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM cards c WHERE c.id = card_id AND c.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM cards c WHERE c.id = card_id AND c.user_id = auth.uid())
  );
