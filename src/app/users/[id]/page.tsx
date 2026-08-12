"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  UserPlus,
  UserCheck,
  Activity,
  TrendingUp,
  Flame,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useFollow } from "@/hooks/use-follow";
import { formatDistance, formatDate } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

interface UserActivity {
  id: string;
  type: string;
  distance: number;
  duration: number;
  created_at: string;
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalRuns: 0,
    avgPace: 0,
  });
  const [loading, setLoading] = useState(true);

  const { isFollowing, followerCount, followingCount, toggleFollow } = useFollow(
    id,
    user?.id
  );

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileData) setProfile(profileData as Profile);

      const { data: activitiesData } = await supabase
        .from("activities")
        .select("id, type, distance, duration, avg_pace, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (activitiesData) {
        setActivities(activitiesData as UserActivity[]);
        const totalDist = activitiesData.reduce((sum, a) => sum + a.distance, 0);
        const totalRuns = activitiesData.length;
        const avgPace =
          totalRuns > 0
            ? activitiesData.reduce((sum, a) => sum + (a as any).avg_pace, 0) / totalRuns
            : 0;
        setStats({ totalDistance: totalDist, totalRuns, avgPace });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fire">
        <div className="display-title text-2xl text-cream animate-pulse">
          CARGANDO...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-fire px-6 text-center">
        <h1 className="display-title text-4xl text-cream">
          Usuario no encontrado
        </h1>
        <Link href="/feed" className="brand-button mt-6">
          Volver al feed
        </Link>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => window.history.back()}
            className="ghost-button mb-4 px-3"
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          {/* Profile Header */}
          <section className="brand-panel mb-5 overflow-hidden">
            <div className="h-28 border-b border-wool/10 bg-[linear-gradient(120deg,rgba(116,23,23,0.75),rgba(189,105,93,0.32))] bg-cover bg-center" />
            <div className="px-5 pb-6">
              <div className="-mt-12 mb-4 flex items-end justify-between gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-caramel bg-chestnut shadow-xl shadow-dark/30">
                  <span className="font-display text-4xl text-cream uppercase">
                    {profile.full_name?.charAt(0) || "U"}
                  </span>
                </div>
                {!isOwnProfile && (
                  <button
                    onClick={toggleFollow}
                    className={`flex items-center gap-2 px-5 py-2.5 font-secondary text-sm font-bold transition-all ${
                      isFollowing
                        ? "border border-wool/20 bg-dark/40 text-wool hover:border-red-500/40 hover:text-red-400"
                        : "brand-button"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck size={16} />
                        Siguiendo
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Seguir
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="section-kicker">Perfil runner</p>
              <h1 className="display-title mt-2 text-5xl text-cream">
                {profile.full_name || "Runner"}
              </h1>
              <p className="font-secondary text-sm font-bold text-caramel">
                @{profile.username || "runner"}
              </p>
              {profile.bio && (
                <p className="mt-4 max-w-2xl font-secondary text-sm leading-6 text-wool/68">
                  {profile.bio}
                </p>
              )}
            </div>
          </section>

          {/* Stats */}
          <section className="mb-5 grid grid-cols-3 gap-3">
            <div className="cream-panel p-5 text-center">
              <p className="display-title text-4xl">
                {formatDistance(stats.totalDistance)}
              </p>
              <p className="mt-1 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-fire/58">
                Distancia
              </p>
            </div>
            <div className="metric-card p-5 text-center">
              <p className="display-title text-4xl text-caramel">
                {stats.totalRuns}
              </p>
              <p className="mt-1 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Carreras
              </p>
            </div>
            <div className="metric-card p-5 text-center">
              <p className="display-title text-4xl text-caramel">
                {followerCount}
              </p>
              <p className="mt-1 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Seguidores
              </p>
            </div>
          </section>

          {/* Info Rows */}
          <section className="mb-5 grid gap-3">
            <div className="brand-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center border border-caramel/25 bg-wine/25">
                <Mail size={18} className="text-caramel" />
              </div>
              <div className="min-w-0">
                <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                  Email
                </p>
                <p className="truncate font-secondary text-sm text-cream">
                  {isOwnProfile ? user?.email : "Privado"}
                </p>
              </div>
            </div>
            {profile.location && (
              <div className="brand-panel flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center border border-caramel/25 bg-wine/25">
                  <MapPin size={18} className="text-caramel" />
                </div>
                <div className="min-w-0">
                  <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                    Ubicación
                  </p>
                  <p className="truncate font-secondary text-sm text-cream">
                    {profile.location}
                  </p>
                </div>
              </div>
            )}
            <div className="brand-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center border border-caramel/25 bg-wine/25">
                <Calendar size={18} className="text-caramel" />
              </div>
              <div className="min-w-0">
                <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                  Miembro desde
                </p>
                <p className="truncate font-secondary text-sm text-cream">
                  {new Date(profile.created_at).toLocaleDateString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </section>

          {/* Recent Activities */}
          <section className="brand-panel p-5">
            <p className="section-kicker mb-3">Actividades recientes</p>
            {activities.length === 0 ? (
              <p className="py-8 text-center font-secondary text-sm text-wool/42">
                Sin actividades aún
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <Link key={act.id} href={`/activities/${act.id}`}>
                    <div className="flex items-center justify-between border-b border-wool/8 py-3 last:border-0 transition hover:bg-wool/5 -mx-2 px-2">
                      <div className="flex items-center gap-3">
                        <Activity size={16} className="text-caramel" />
                        <div>
                          <p className="font-secondary text-sm font-bold text-cream capitalize">
                            {act.type}
                          </p>
                          <p className="font-secondary text-[10px] text-wool/42">
                            {formatDate(act.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="font-secondary text-sm font-bold text-caramel">
                        {formatDistance(act.distance)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
