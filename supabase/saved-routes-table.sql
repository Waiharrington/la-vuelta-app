-- Saved Routes table for La Vuelta Running Club
-- Run this SQL on the Supabase VPS to create the table

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
