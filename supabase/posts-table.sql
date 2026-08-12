-- =============================================
-- La Vuelta - Tabla de publicaciones (posts)
-- =============================================

CREATE TABLE IF NOT EXISTS lavuelta.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE lavuelta.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON lavuelta.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON lavuelta.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON lavuelta.posts FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_lavuelta_posts_user ON lavuelta.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_lavuelta_posts_created ON lavuelta.posts(created_at DESC);

-- Permissions
GRANT SELECT, INSERT, DELETE ON lavuelta.posts TO authenticated;
GRANT SELECT ON lavuelta.posts TO anon;
