export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  distance: number;
  duration: number;
  avg_pace: number;
  max_pace: number;
  calories: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  notes: string;
  route_coordinates: unknown;
  is_public: boolean;
  created_at: string;
}

export interface ActivityWithProfile extends Activity {
  profiles: Pick<Profile, "full_name" | "username" | "avatar_url">;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "username" | "avatar_url">;
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  activity_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  activity_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "username" | "avatar_url">;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
}

export interface ClubMember {
  club_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  description: string;
  event_date: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  distance_target: number;
  created_by: string;
  created_at: string;
}

export interface EventParticipant {
  event_id: string;
  user_id: string;
  status: string;
  joined_at: string;
}

export interface Split {
  km: number;
  time: number;
  pace: number;
}

export interface RouteCoordinates {
  coordinates: number[][];
  splits?: Split[];
}
