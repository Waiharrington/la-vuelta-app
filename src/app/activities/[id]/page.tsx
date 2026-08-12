"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Clock,
  Flame,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  TrendingUp,
  Zap,
  Share2,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDuration, formatPace, formatDate } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center bg-dark/70">
      <p className="font-secondary text-sm text-wool/45">Cargando mapa...</p>
    </div>
  ),
});

interface Activity {
  id: string;
  user_id: string;
  type: string;
  distance: number;
  duration: number;
  avg_pace: number;
  calories: number;
  notes: string | null;
  created_at: string;
  route_coordinates: { lat: number; lng: number; timestamp: number }[] | null;
  splits: { km: number; time: number; pace: number }[] | null;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchActivity = async () => {
      const { data: act } = await supabase
        .from("activities")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("id", id)
        .single();

      if (act) {
        setActivity(act as Activity);

        const { data: likes } = await supabase
          .from("likes")
          .select("user_id")
          .eq("activity_id", id);

        setLikeCount(likes?.length || 0);
        setLikedByMe(likes?.some((l) => l.user_id === user?.id) || false);
      }

      const { data: cmts } = await supabase
        .from("comments")
        .select("*, profiles(full_name, username, avatar_url)")
        .eq("activity_id", id)
        .order("created_at", { ascending: true });

      if (cmts) setComments(cmts as Comment[]);
      setLoading(false);
    };

    fetchActivity();
  }, [id, user, supabase]);

  const handleLike = async () => {
    if (!user) return;

    setLikedByMe(!likedByMe);
    setLikeCount((c) => (likedByMe ? c - 1 : c + 1));

    if (likedByMe) {
      await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("activity_id", id);
    } else {
      await supabase.from("likes").insert({
        user_id: user.id,
        activity_id: id,
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || sending) return;

    setSending(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ user_id: user.id, activity_id: id, content: newComment.trim() })
      .select("*, profiles(full_name, username, avatar_url)")
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setNewComment("");
    }
    setSending(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Actividad de ${activity?.profiles?.full_name || "Runner"}`,
        text: `${formatDistance(activity?.distance || 0)} en ${formatDuration(activity?.duration || 0)}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copiado");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fire">
        <div className="display-title text-2xl text-cream animate-pulse">
          CARGANDO...
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-fire px-6 text-center">
        <h1 className="display-title text-4xl text-cream">Actividad no encontrada</h1>
        <Link href="/feed" className="brand-button mt-6">
          Volver al feed
        </Link>
      </div>
    );
  }

  const positions = activity.route_coordinates || [];
  const splits = activity.splits || [];
  const isOwner = user?.id === activity.user_id;
  const elevation = positions.length > 1
    ? positions.reduce((acc, p, i) => {
        if (i === 0) return 0;
        const diff = Math.abs((p as any).alt - (positions[i - 1] as any).alt || 0);
        return acc + (diff > 0 ? diff : 0);
      }, 0)
    : 0;

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="ghost-button px-3"
            >
              <ArrowLeft size={18} />
              Volver
            </button>
            <button onClick={handleShare} className="ghost-button px-3">
              <Share2 size={18} />
            </button>
          </div>

          {/* Map */}
          {positions.length > 1 && (
            <div className="brand-panel mb-5 overflow-hidden">
              <div className="h-72 sm:h-96">
                <MapView positions={positions as any} />
              </div>
            </div>
          )}

          {/* Activity Header */}
          <div className="brand-panel mb-5 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
                <span className="font-display text-lg text-cream">
                  {activity.profiles?.full_name?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <p className="font-secondary text-sm font-bold text-cream">
                  {activity.profiles?.full_name || "Runner"}
                </p>
                <p className="font-secondary text-xs text-wool/42">
                  @{activity.profiles?.username || "runner"}
                </p>
              </div>
              <span className="ml-auto border border-caramel/25 bg-wine/35 px-3 py-1 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-caramel">
                {activity.type}
              </span>
            </div>

            <p className="font-secondary text-xs text-wool/42 mb-4">
              {formatDate(activity.created_at)}
            </p>

            {/* Main Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="metric-card p-4 text-center">
                <MapPin size={18} className="mx-auto mb-2 text-caramel" />
                <p className="display-title text-3xl text-cream">
                  {formatDistance(activity.distance)}
                </p>
                <p className="font-secondary text-[10px] uppercase tracking-[0.15em] text-wool/42">
                  Distancia
                </p>
              </div>
              <div className="metric-card p-4 text-center">
                <Clock size={18} className="mx-auto mb-2 text-caramel" />
                <p className="display-title text-3xl text-cream">
                  {formatDuration(activity.duration)}
                </p>
                <p className="font-secondary text-[10px] uppercase tracking-[0.15em] text-wool/42">
                  Tiempo
                </p>
              </div>
              <div className="metric-card p-4 text-center">
                <Zap size={18} className="mx-auto mb-2 text-caramel" />
                <p className="display-title text-3xl text-caramel">
                  {formatPace(activity.avg_pace)}
                </p>
                <p className="font-secondary text-[10px] uppercase tracking-[0.15em] text-wool/42">
                  Ritmo/km
                </p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-wool/10 pt-4">
              <div className="text-center">
                <Flame size={14} className="mx-auto mb-1 text-wool/42" />
                <p className="font-secondary text-lg font-bold text-cream">
                  {activity.calories || 0}
                </p>
                <p className="font-secondary text-[9px] uppercase tracking-[0.12em] text-wool/38">
                  Calorías
                </p>
              </div>
              <div className="text-center">
                <TrendingUp size={14} className="mx-auto mb-1 text-wool/42" />
                <p className="font-secondary text-lg font-bold text-cream">
                  {activity.avg_pace > 0 ? Math.round(60 / (1000 / activity.avg_pace)) : 0}
                </p>
                <p className="font-secondary text-[9px] uppercase tracking-[0.12em] text-wool/38">
                  Km/h
                </p>
              </div>
              <div className="text-center">
                <MapPin size={14} className="mx-auto mb-1 text-wool/42" />
                <p className="font-secondary text-lg font-bold text-cream">
                  {Math.round(activity.distance / (activity.duration / 60) * 100) / 100 || 0}
                </p>
                <p className="font-secondary text-[9px] uppercase tracking-[0.12em] text-wool/38">
                  Pasos/min
                </p>
              </div>
            </div>

            {/* Notes */}
            {activity.notes && (
              <p className="mt-4 border-l-2 border-caramel/55 pl-3 font-secondary text-sm leading-6 text-wool/72">
                {activity.notes}
              </p>
            )}
          </div>

          {/* Splits */}
          {splits.length > 0 && (
            <div className="brand-panel mb-5 p-5">
              <p className="section-kicker mb-3">Splits por kilómetro</p>
              <div className="space-y-2">
                {splits.map((split, i) => {
                  const prevPace = i > 0 ? splits[i - 1].pace : split.pace;
                  const diff = split.pace - prevPace;
                  const isFaster = diff < 0;

                  return (
                    <div
                      key={split.km}
                      className="flex items-center justify-between border-b border-wool/8 py-2 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center border border-caramel/25 bg-wine/25">
                          <span className="font-display text-sm text-caramel">
                            {split.km}
                          </span>
                        </div>
                        <div>
                          <p className="font-secondary text-sm font-bold text-cream">
                            KM {split.km}
                          </p>
                          <p className="font-secondary text-[10px] text-wool/42">
                            {formatDuration(split.time)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-secondary text-lg font-bold text-caramel">
                          {formatPace(1000 / split.pace)}
                        </p>
                        {i > 0 && (
                          <p
                            className={`font-secondary text-[10px] ${
                              isFaster ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {isFaster ? "-" : "+"}
                            {Math.abs(diff).toFixed(0)}s
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="brand-panel mb-5 flex items-center gap-5 p-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 font-secondary text-sm font-semibold transition-colors"
            >
              <Heart
                size={20}
                className={
                  likedByMe
                    ? "fill-red-500 text-red-500"
                    : "text-wool/44 hover:text-red-400"
                }
              />
              <span className={likedByMe ? "text-red-400" : "text-wool/44"}>
                {likeCount > 0 ? likeCount : "Me gusta"}
              </span>
            </button>
            <div className="flex items-center gap-2 font-secondary text-sm text-wool/44">
              <MessageCircle size={20} />
              <span>
                {comments.length} comentario{comments.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="brand-panel p-5">
            <p className="section-kicker mb-4">Comentarios</p>

            {comments.length > 0 && (
              <div className="mb-4 space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-caramel/20 bg-chestnut/70">
                      <span className="font-display text-[10px] text-cream">
                        {comment.profiles?.full_name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-secondary text-xs leading-5">
                        <span className="font-bold text-cream">
                          {comment.profiles?.full_name || "Runner"}
                        </span>{" "}
                        <span className="text-wool/68">{comment.content}</span>
                      </p>
                      <p className="font-secondary text-[10px] text-wool/32">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 border border-wool/12 bg-dark/40 px-3 py-2 font-secondary text-sm text-cream outline-none transition-colors placeholder:text-wool/32 focus:border-caramel/50"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-wool/12 bg-wine/40 text-caramel transition-colors hover:bg-wine/60 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
