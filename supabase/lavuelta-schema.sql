-- =============================================
-- La Vuelta Running Club - Supabase Schema
-- Multi-Tenant: esquema dedicado "lavuelta"
-- =============================================

-- 1. Crear esquema dedicado
CREATE SCHEMA IF NOT EXISTS lavuelta;

-- 2. Tabla de perfiles (vinculada a auth.users compartida)
CREATE TABLE lavuelta.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT DEFAULT 'Maracay, Venezuela',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de actividades (runs, walks, bikes)
CREATE TABLE lavuelta.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'run' CHECK (type IN ('run', 'walk', 'bike', 'hike')),
  distance NUMERIC NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  avg_pace NUMERIC DEFAULT 0,
  max_pace NUMERIC DEFAULT 0,
  calories INTEGER DEFAULT 0,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  notes TEXT,
  route_coordinates JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de likes
CREATE TABLE lavuelta.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES lavuelta.activities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- 5. Tabla de comentarios
CREATE TABLE lavuelta.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES lavuelta.activities(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de seguimiento (follows)
CREATE TABLE lavuelta.follows (
  follower_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 7. Tabla de clubs
CREATE TABLE lavuelta.clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES lavuelta.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla de miembros de club
CREATE TABLE lavuelta.club_members (
  club_id UUID REFERENCES lavuelta.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

-- 9. Tabla de eventos
CREATE TABLE lavuelta.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES lavuelta.clubs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  distance_target NUMERIC,
  created_by UUID REFERENCES lavuelta.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabla de participantes en eventos
CREATE TABLE lavuelta.event_participants (
  event_id UUID REFERENCES lavuelta.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES lavuelta.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_lavuelta_activities_user ON lavuelta.activities(user_id);
CREATE INDEX idx_lavuelta_activities_created ON lavuelta.activities(created_at DESC);
CREATE INDEX idx_lavuelta_activities_type ON lavuelta.activities(type);
CREATE INDEX idx_lavuelta_likes_activity ON lavuelta.likes(activity_id);
CREATE INDEX idx_lavuelta_comments_activity ON lavuelta.comments(activity_id);
CREATE INDEX idx_lavuelta_follows_follower ON lavuelta.follows(follower_id);
CREATE INDEX idx_lavuelta_follows_following ON lavuelta.follows(following_id);
CREATE INDEX idx_lavuelta_club_members_user ON lavuelta.club_members(user_id);
CREATE INDEX idx_lavuelta_events_date ON lavuelta.events(event_date);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE lavuelta.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavuelta.event_participants ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "profiles_select" ON lavuelta.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON lavuelta.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON lavuelta.profiles FOR UPDATE USING (auth.uid() = id);

-- Activities: public read, owner CRUD
CREATE POLICY "activities_select" ON lavuelta.activities FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "activities_insert" ON lavuelta.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_update" ON lavuelta.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activities_delete" ON lavuelta.activities FOR DELETE USING (auth.uid() = user_id);

-- Likes: public read, owner CRUD
CREATE POLICY "likes_select" ON lavuelta.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON lavuelta.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON lavuelta.likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, owner CRUD
CREATE POLICY "comments_select" ON lavuelta.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON lavuelta.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON lavuelta.comments FOR DELETE USING (auth.uid() = user_id);

-- Follows: public read, owner CRUD
CREATE POLICY "follows_select" ON lavuelta.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON lavuelta.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON lavuelta.follows FOR DELETE USING (auth.uid() = follower_id);

-- Clubs: public read, creator manage
CREATE POLICY "clubs_select" ON lavuelta.clubs FOR SELECT USING (true);
CREATE POLICY "clubs_insert" ON lavuelta.clubs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "clubs_update" ON lavuelta.clubs FOR UPDATE USING (created_by = auth.uid());

-- Club members: public read, admin manage
CREATE POLICY "club_members_select" ON lavuelta.club_members FOR SELECT USING (true);
CREATE POLICY "club_members_insert" ON lavuelta.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "club_members_delete" ON lavuelta.club_members FOR DELETE USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM lavuelta.club_members cm
    WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);

-- Events: public read, creator manage
CREATE POLICY "events_select" ON lavuelta.events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON lavuelta.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_update" ON lavuelta.events FOR UPDATE USING (created_by = auth.uid());

-- Event participants: public read, owner CRUD
CREATE POLICY "event_participants_select" ON lavuelta.event_participants FOR SELECT USING (true);
CREATE POLICY "event_participants_insert" ON lavuelta.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_participants_delete" ON lavuelta.event_participants FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('lavuelta_avatars', 'lavuelta_avatars', true),
  ('lavuelta_activities', 'lavuelta_activities', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lavuelta_avatars');

CREATE POLICY "Anyone can upload an avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lavuelta_avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Activity images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lavuelta_activities');

CREATE POLICY "Authenticated users can upload activity images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lavuelta_activities' AND auth.role() = 'authenticated');

-- =============================================
-- FUNCIONES RPC
-- =============================================

-- Funcion para obtener ranking
CREATE OR REPLACE FUNCTION lavuelta.get_leaderboard(
  p_period TEXT DEFAULT 'week',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  total_distance NUMERIC,
  total_runs BIGINT,
  avg_pace NUMERIC
) AS $$
DECLARE
  v_since TIMESTAMPTZ;
BEGIN
  IF p_period = 'week' THEN
    v_since := NOW() - INTERVAL '7 days';
  ELSIF p_period = 'month' THEN
    v_since := NOW() - INTERVAL '30 days';
  ELSE
    v_since := '1970-01-01'::TIMESTAMPTZ;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    COALESCE(SUM(a.distance), 0) AS total_distance,
    COUNT(a.id) AS total_runs,
    CASE WHEN COUNT(a.id) > 0 THEN AVG(a.avg_pace) ELSE 0 END AS avg_pace
  FROM lavuelta.profiles p
  LEFT JOIN lavuelta.activities a ON a.user_id = p.id AND a.created_at >= v_since
  GROUP BY p.id, p.full_name, p.username, p.avatar_url
  ORDER BY total_distance DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CLUB DEFAULT: La Vuelta Running Club
-- =============================================
INSERT INTO lavuelta.clubs (name, slug, description)
VALUES ('La Vuelta Running Club', 'la-vuelta', 'Comunidad runner en Maracay. No importa tu ritmo. La vuelta se da juntos.')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- TABLA DE PUBLICACIONES (POSTS)
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

-- =============================================
-- TABLA DE RUTAS GUARDADAS (SAVED ROUTES)
-- =============================================

CREATE TABLE IF NOT EXISTS lavuelta.saved_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  distance NUMERIC NOT NULL,
  duration NUMERIC,
  route_coordinates JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  use_count NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_routes_user ON lavuelta.saved_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_routes_public ON lavuelta.saved_routes(is_public) WHERE is_public = true;

-- RLS
ALTER TABLE lavuelta.saved_routes ENABLE ROW LEVEL SECURITY;

-- Public routes are readable by everyone
CREATE POLICY "Public routes are readable by everyone"
  ON lavuelta.saved_routes FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can insert their own routes
CREATE POLICY "Users can insert own routes"
  ON lavuelta.saved_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own routes
CREATE POLICY "Users can update own routes"
  ON lavuelta.saved_routes FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own routes
CREATE POLICY "Users can delete own routes"
  ON lavuelta.saved_routes FOR DELETE
  USING (auth.uid() = user_id);
