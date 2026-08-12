"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  Calendar,
  Camera,
  Check,
  Mail,
  MapPin,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useFollow } from "@/hooks/use-follow";
import { formatDistance } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

interface Stats {
  totalDistance: number;
  totalRuns: number;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ totalDistance: 0, totalRuns: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    username: "",
    bio: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const { followerCount, followingCount } = useFollow(user?.id, user?.id);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
        setEditData({
          full_name: profileData.full_name || "",
          username: profileData.username || "",
          bio: profileData.bio || "",
          location: profileData.location || "",
        });
      }

      const { data: activities } = await supabase
        .from("activities")
        .select("distance")
        .eq("user_id", user.id);

      if (activities) {
        setStats({
          totalDistance: activities.reduce(
            (sum, activity) => sum + activity.distance,
            0
          ),
          totalRuns: activities.length,
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editData.full_name,
        username: editData.username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        bio: editData.bio || null,
        location: editData.location || null,
      })
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: editData.full_name,
              username: editData.username,
              bio: editData.bio,
              location: editData.location,
            }
          : prev
      );
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditData({
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
    });
    setEditing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fire">
        <div className="display-title text-2xl text-cream animate-pulse">
          CARGANDO...
        </div>
      </div>
    );
  }

  const initial = profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U";

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-4xl">
          {/* Profile Header */}
          <section className="brand-panel mb-5 overflow-hidden">
            <div className="h-28 border-b border-wool/10 bg-[linear-gradient(120deg,rgba(116,23,23,0.75),rgba(189,105,93,0.32)),url('/brand/hero-bg-v3.png')] bg-cover bg-center" />
            <div className="px-5 pb-6">
              <div className="-mt-12 mb-4 flex items-end justify-between gap-4">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-caramel bg-chestnut shadow-xl shadow-dark/30">
                    <span className="font-display text-4xl text-cream uppercase">
                      {initial}
                    </span>
                  </div>
                  {editing && (
                    <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-caramel/40 bg-wine text-cream">
                      <Camera size={14} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="ghost-button px-3"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="brand-button px-4"
                      >
                        <Check size={16} />
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="ghost-button px-3"
                      aria-label="Editar perfil"
                    >
                      <Settings size={17} />
                    </button>
                  )}
                </div>
              </div>

              <p className="section-kicker">Perfil runner</p>

              {editing ? (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={editData.full_name}
                    onChange={(e) =>
                      setEditData({ ...editData, full_name: e.target.value })
                    }
                    placeholder="Tu nombre"
                    className="brand-input"
                  />
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) =>
                      setEditData({ ...editData, username: e.target.value })
                    }
                    placeholder="username"
                    className="brand-input"
                  />
                  <textarea
                    value={editData.bio}
                    onChange={(e) =>
                      setEditData({ ...editData, bio: e.target.value })
                    }
                    placeholder="Tu bio..."
                    rows={3}
                    className="brand-input resize-none"
                  />
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) =>
                      setEditData({ ...editData, location: e.target.value })
                    }
                    placeholder="Tu ubicación"
                    className="brand-input"
                  />
                </div>
              ) : (
                <>
                  <h1 className="display-title mt-2 text-5xl text-cream">
                    {profile?.full_name || "Runner"}
                  </h1>
                  <p className="font-secondary text-sm font-bold text-caramel">
                    @{profile?.username || "runner"}
                  </p>
                  {profile?.bio && (
                    <p className="mt-4 max-w-2xl font-secondary text-sm leading-6 text-wool/68">
                      {profile.bio}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Stats + Followers */}
          <section className="mb-5 grid grid-cols-4 gap-3">
            <Link href="/activities" className="cream-panel p-4 text-center transition hover:-translate-y-0.5">
              <p className="display-title text-4xl">
                {formatDistance(stats.totalDistance)}
              </p>
              <p className="mt-1 font-secondary text-[9px] font-bold uppercase tracking-[0.16em] text-fire/58">
                Distancia
              </p>
            </Link>
            <div className="metric-card p-4 text-center">
              <p className="display-title text-4xl text-caramel">
                {stats.totalRuns}
              </p>
              <p className="mt-1 font-secondary text-[9px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Carreras
              </p>
            </div>
            <div className="metric-card p-4 text-center">
              <p className="display-title text-4xl text-caramel">
                {followerCount}
              </p>
              <p className="mt-1 font-secondary text-[9px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Seguidores
              </p>
            </div>
            <div className="metric-card p-4 text-center">
              <p className="display-title text-4xl text-caramel">
                {followingCount}
              </p>
              <p className="mt-1 font-secondary text-[9px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Siguiendo
              </p>
            </div>
          </section>

          {/* Info Rows */}
          <section className="grid gap-3">
            <InfoRow icon={Mail} label="Email" value={user?.email || ""} />
            {profile?.location && (
              <InfoRow icon={MapPin} label="Ubicación" value={profile.location} />
            )}
            <InfoRow
              icon={Calendar}
              label="Miembro desde"
              value={
                profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })
                  : "2026"
              }
            />
            <InfoRow icon={User} label="Club" value="La Vuelta Running Co." />
          </section>
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="brand-panel flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center border border-caramel/25 bg-wine/25">
        <Icon size={18} className="text-caramel" />
      </div>
      <div className="min-w-0">
        <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
          {label}
        </p>
        <p className="truncate font-secondary text-sm text-cream">{value}</p>
      </div>
    </div>
  );
}
