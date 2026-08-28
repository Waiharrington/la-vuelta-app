-- Post Likes (separate from activity likes due to FK constraints)
CREATE TABLE IF NOT EXISTS lavuelta.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES lavuelta.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Post Comments (separate from activity comments due to FK constraints)
CREATE TABLE IF NOT EXISTS lavuelta.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES lavuelta.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lavuelta_post_likes_post ON lavuelta.post_likes(post_id);
CREATE INDEX idx_lavuelta_post_comments_post ON lavuelta.post_comments(post_id);

-- RLS
ALTER TABLE lavuelta.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes_select" ON lavuelta.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON lavuelta.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON lavuelta.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "post_comments_select" ON lavuelta.post_comments FOR SELECT USING (true);
CREATE POLICY "post_comments_insert" ON lavuelta.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_comments_delete" ON lavuelta.post_comments FOR DELETE USING (auth.uid() = user_id);
