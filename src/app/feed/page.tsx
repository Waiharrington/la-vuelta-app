"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Clock,
  Heart,
  ImageIcon,
  MapPin,
  MessageCircle,
  PlusCircle,
  Send,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDuration, formatPace, formatDate } from "@/lib/utils";
import { FeedSkeleton, Skeleton } from "@/components/skeleton";

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

interface Activity {
  id: string;
  user_id: string;
  type: string;
  distance: number;
  duration: number;
  avg_pace: number;
  calories: number;
  notes: string;
  created_at: string;
  route_coordinates: unknown;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
}

type FeedItem =
  | { kind: "activity"; data: Activity; date: string }
  | { kind: "post"; data: Post; date: string };

function parsePostPhotos(content: string): { text: string; photos: string[] } {
  const marker = content.match(/\n\n\[photos:(.+)\]\s*$/);
  if (!marker) return { text: content, photos: [] };
  try {
    const photos = JSON.parse(marker[1]) as { url: string }[];
    return { text: content.slice(0, marker.index), photos: photos.map((p) => p.url) };
  } catch {
    return { text: content, photos: [] };
  }
}

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [sendingPost, setSendingPost] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchFeed = useCallback(async () => {
    if (!user) return;

    // Fetch activities
    const { data: activities } = await supabase
      .from("activities")
      .select("*, profiles(full_name, username, avatar_url)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch posts
    const { data: posts } = await supabase
      .from("posts")
      .select("*, profiles(full_name, username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch likes for activities (uses activity_id FK)
    const activityIds = activities?.map((a) => a.id) || [];

    const { data: activityLikes } = await supabase
      .from("likes")
      .select("activity_id, user_id")
      .in("activity_id", activityIds);

    const { data: activityComments } = await supabase
      .from("comments")
      .select("activity_id")
      .in("activity_id", activityIds);

    // Fetch likes for posts (uses post_id FK)
    const postIds = posts?.map((p) => p.id) || [];

    const { data: postLikes } = await supabase
      .from("post_likes")
      .select("post_id, user_id")
      .in("post_id", postIds);

    const { data: postComments } = await supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds);

    // Build lookup maps for activities
    const likeCounts: Record<string, number> = {};
    const myLikes = new Set<string>();
    activityLikes?.forEach((like) => {
      likeCounts[like.activity_id] = (likeCounts[like.activity_id] || 0) + 1;
      if (like.user_id === user.id) myLikes.add(like.activity_id);
    });

    const commentCounts: Record<string, number> = {};
    activityComments?.forEach((c) => {
      commentCounts[c.activity_id] = (commentCounts[c.activity_id] || 0) + 1;
    });

    // Build lookup maps for posts
    postLikes?.forEach((like) => {
      likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
      if (like.user_id === user.id) myLikes.add(like.post_id);
    });

    postComments?.forEach((c) => {
      commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
    });

    // Merge into feed items
    const items: FeedItem[] = [];

    activities?.forEach((a) => {
      items.push({
        kind: "activity",
        data: {
          ...a,
          likeCount: likeCounts[a.id] || 0,
          likedByMe: myLikes.has(a.id),
          commentCount: commentCounts[a.id] || 0,
        } as Activity,
        date: a.created_at,
      });
    });

    posts?.forEach((p) => {
      items.push({
        kind: "post",
        data: {
          ...p,
          likeCount: likeCounts[p.id] || 0,
          likedByMe: myLikes.has(p.id),
          commentCount: commentCounts[p.id] || 0,
        } as Post,
        date: p.created_at,
      });
    });

    // Sort by date (newest first)
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFeedItems(items);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - photoFiles.length;
    const valid = files.slice(0, remaining).filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;

    setPhotoFiles((prev) => [...prev, ...valid]);
    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (userId: string): Promise<{ url: string }[]> => {
    if (!photoFiles.length) return [];
    setUploadingPhotos(true);
    const timestamp = Date.now();
    const uploaded: { url: string }[] = [];

    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/posts/${timestamp}_${i}.${ext}`;

      const { data, error } = await supabase.storage
        .from("lavuelta_activities")
        .upload(path, file, { contentType: file.type });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from("lavuelta_activities")
          .getPublicUrl(data.path);
        uploaded.push({ url: urlData.publicUrl });
      }
    }

    setUploadingPhotos(false);
    return uploaded;
  };

  const handlePublish = async () => {
    if (!user || !newPost.trim() || sendingPost) return;

    setSendingPost(true);

    // Ensure profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      const username = user.email?.split("@")[0] || `user-${user.id.slice(0, 8)}`;
      await supabase.from("profiles").insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || username,
        username,
      });
    }

    const photos = await uploadPhotos(user.id);
    const content = photos.length
      ? `${newPost.trim()}\n\n[photos:${JSON.stringify(photos)}]`
      : newPost.trim();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content,
      })
      .select("*, profiles(full_name, username, avatar_url)")
      .single();

    if (!error && data) {
      setFeedItems((prev) => [
        {
          kind: "post",
          data: {
            ...data,
            likeCount: 0,
            likedByMe: false,
            commentCount: 0,
          } as Post,
          date: data.created_at,
        },
        ...prev,
      ]);
      setNewPost("");
      setPhotoFiles([]);
      setPhotoPreviews([]);
    }
    setSendingPost(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    await supabase.from("posts").delete().eq("id", postId);
    setFeedItems((prev) => prev.filter((item) => !(item.kind === "post" && item.data.id === postId)));
  };

  const handleToggleLike = async (itemId: string) => {
    if (!user) return;

    const item = feedItems.find((i) => i.data.id === itemId);
    if (!item) return;

    // Optimistic update
    setFeedItems((prev) =>
      prev.map((i) => {
        if (i.data.id !== itemId) return i;
        return {
          kind: i.kind,
          date: i.date,
          data: {
            ...i.data,
            likedByMe: !i.data.likedByMe,
            likeCount: i.data.likedByMe ? i.data.likeCount - 1 : i.data.likeCount + 1,
          },
        } as FeedItem;
      })
    );

    if (item.data.likedByMe) {
      if (item.kind === "post") {
        await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", itemId);
      } else {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("activity_id", itemId);
      }
    } else {
      if (item.kind === "post") {
        await supabase.from("post_likes").insert({
          user_id: user.id,
          post_id: itemId,
        });
      } else {
        await supabase.from("likes").insert({
          user_id: user.id,
          activity_id: itemId,
        });
      }
    }
  };

  const handleCommentAdded = (itemId: string) => {
    setFeedItems((prev) =>
      prev.map((i) => {
        if (i.data.id !== itemId) return i;
        return {
          kind: i.kind,
          date: i.date,
          data: { ...i.data, commentCount: i.data.commentCount + 1 },
        } as FeedItem;
      })
    );
  };

  if (authLoading || loading) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-5 overflow-hidden border border-wool/10 bg-wine/88 py-3">
              <div className="flex whitespace-nowrap">
                <span className="display-title px-5 text-lg text-wool/40 animate-pulse">CARGANDO...</span>
              </div>
            </div>
            <div className="brand-panel mb-5 p-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            </div>
            <FeedSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          <section className="mb-5 overflow-hidden border border-wool/10 bg-wine/88 py-3">
            <div className="ticker-animate flex whitespace-nowrap">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="flex">
                  {[
                    "NADIE CORRE CON EGO",
                    "TODOS LOS RITMOS SE RESPETAN",
                    "EL NUEVO SE INTEGRA",
                    "LA COMUNIDAD VA PRIMERO",
                  ].map((item) => (
                    <span key={item} className="display-title px-5 text-lg text-wool/80">
                      {item} {"//"}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Post creation box */}
          <div className="brand-panel mb-5 p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
                <span className="font-display text-sm text-cream">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="¿Qué pensás hoy? Compartilo con la comunidad..."
                  rows={2}
                  maxLength={500}
                  className="brand-input resize-none text-sm"
                  aria-label="Crear publicación"
                />

                {photoPreviews.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden border border-wool/12">
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-dark/80 text-wool/60 hover:text-cream"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-secondary text-[10px] text-wool/32">
                      {newPost.length}/500
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoFiles.length >= 3 || uploadingPhotos}
                      className="text-wool/32 transition-colors hover:text-caramel disabled:opacity-40"
                      aria-label="Agregar fotos"
                    >
                      <ImageIcon size={16} />
                    </button>
                    {photoFiles.length > 0 && (
                      <span className="font-secondary text-[10px] text-wool/32">
                        {photoFiles.length}/3 fotos
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handlePublish}
                    disabled={!newPost.trim() || sendingPost}
                    className="brand-button px-5 py-2 text-xs"
                  >
                    <Send size={13} />
                    {sendingPost ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="brand-panel p-5 sm:p-6">
              <p className="section-kicker mb-3">Comunidad</p>
              <h1 className="display-title text-5xl text-cream sm:text-7xl">
                El pelotón.
              </h1>
              <p className="mt-4 max-w-2xl font-secondary text-sm leading-6 text-wool/68 sm:text-base">
                Cada vuelta cuenta una historia. Comparte la tuya, celebra las
                de los demás. Aquí corremos juntos.
              </p>
            </div>
            <Link
              href="/tracker"
              className="cream-panel flex min-h-40 flex-col justify-between p-5 transition hover:-translate-y-0.5"
            >
              <PlusCircle size={28} className="text-wine" />
              <div>
                <p className="display-title text-4xl">Grabar vuelta</p>
                <p className="mt-2 font-secondary text-sm font-semibold text-fire/70">
                  Inicia el GPS y comparte tu próxima salida.
                </p>
              </div>
            </Link>
          </section>

          {feedItems.length === 0 ? (
            <div className="brand-panel px-5 py-16 text-center">
              <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-caramel/30 bg-dark/45">
                <Heart size={28} className="text-caramel" />
              </div>
              <p className="display-title text-4xl text-cream">
                Aún no hay actividad
              </p>
              <p className="mx-auto mt-2 max-w-sm font-secondary text-sm text-wool/58">
                Sé el primero en compartir tu run y encender el feed de la
                comunidad.
              </p>
              <Link href="/tracker" className="brand-button mt-7">
                Grabar actividad
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {feedItems.map((item) =>
                item.kind === "activity" ? (
                  <ActivityCard
                    key={`activity-${item.data.id}`}
                    activity={item.data}
                    userId={user?.id || ""}
                    onToggleLike={handleToggleLike}
                    onCommentAdded={handleCommentAdded}
                  />
                ) : (
                  <PostCard
                    key={`post-${item.data.id}`}
                    post={item.data}
                    userId={user?.id || ""}
                    onToggleLike={handleToggleLike}
                    onCommentAdded={handleCommentAdded}
                    onDelete={handleDeletePost}
                  />
                )
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────── Post Card ──────────────────────────── */

function PostCard({
  post,
  userId,
  onToggleLike,
  onCommentAdded,
  onDelete,
}: {
  post: Post;
  userId: string;
  onToggleLike: (id: string) => void;
  onCommentAdded: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  const { text: displayText, photos } = parsePostPhotos(post.content);

  const handleLike = () => {
    onToggleLike(post.id);
    if (!post.likedByMe) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 400);
    }
  };

  return (
    <article className="activity-card brand-panel overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <Link href={`/users/${post.user_id}`} className="shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
            <span className="font-display text-base text-cream">
              {post.profiles?.full_name?.charAt(0) || "U"}
            </span>
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/users/${post.user_id}`}>
              <p className="truncate font-secondary text-sm font-bold text-cream hover:text-caramel transition-colors">
                {post.profiles?.full_name || "Runner"}
              </p>
            </Link>
            <Link href={`/users/${post.user_id}`}>
              <span className="font-secondary text-[10px] text-wool/32 hover:text-caramel transition-colors">
                @{post.profiles?.username || "runner"}
              </span>
            </Link>
          </div>
          <p className="font-secondary text-[10px] text-wool/32">
            {formatDate(post.created_at)}
          </p>
        </div>
        {post.user_id === userId && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-wool/22 transition-colors hover:text-red-400"
            aria-label="Eliminar publicación"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="px-4 pb-3">
        {displayText && (
          <p className="font-secondary text-sm leading-6 text-wool/82 whitespace-pre-wrap">
            {displayText}
          </p>
        )}
        {photos.length > 0 && (
          <div className={`mt-3 grid gap-1 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Foto de publicación"
                className={`w-full rounded-sm object-cover ${
                  photos.length === 3 && i === 0 ? "row-span-2 h-full" : "h-36"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 border-t border-wool/10 px-4 py-3">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 font-secondary text-xs font-semibold transition-colors"
          aria-pressed={post.likedByMe}
        >
          <Heart
            size={16}
            className={`transition-colors ${bouncing ? "like-bounce" : ""} ${
              post.likedByMe
                ? "fill-red-500 text-red-500"
                : "text-wool/44 hover:text-red-400"
            }`}
          />
          <span className={post.likedByMe ? "text-red-400" : "text-wool/44"}>
            {post.likeCount > 0 ? post.likeCount : "Me gusta"}
          </span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 font-secondary text-xs font-semibold transition-colors ${
            showComments ? "text-caramel" : "text-wool/44 hover:text-caramel"
          }`}
        >
          <MessageCircle size={16} />
          <span>
            {post.commentCount > 0
              ? `${post.commentCount} comentario${post.commentCount !== 1 ? "s" : ""}`
              : "Comentar"}
          </span>
        </button>
      </div>

      {showComments && (
        <CommentSection
          activityId={post.id}
          userId={userId}
          onCommentAdded={() => onCommentAdded(post.id)}
          kind="post"
        />
      )}
    </article>
  );
}

/* ─────────────────────────── Activity Card ──────────────────────────── */

function ActivityCard({
  activity,
  userId,
  onToggleLike,
  onCommentAdded,
}: {
  activity: Activity;
  userId: string;
  onToggleLike: (id: string) => void;
  onCommentAdded: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  // Extract photos from route_coordinates
  const routeData = activity.route_coordinates as any;
  const photos: string[] = routeData?.photos || [];

  const handleLike = () => {
    onToggleLike(activity.id);
    if (!activity.likedByMe) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 400);
    }
  };

  return (
    <article className="activity-card brand-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-wool/10 p-4">
        <Link href={`/users/${activity.user_id}`} className="shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
            <span className="font-display text-base text-cream">
              {activity.profiles?.full_name?.charAt(0) || "U"}
            </span>
          </div>
        </Link>
        <div className="min-w-0">
          <Link href={`/users/${activity.user_id}`}>
            <p className="truncate font-secondary text-sm font-bold text-cream hover:text-caramel transition-colors">
              {activity.profiles?.full_name || "Runner"}
            </p>
          </Link>
          <Link href={`/users/${activity.user_id}`}>
            <p className="font-secondary text-xs text-wool/42 hover:text-caramel transition-colors">
              @{activity.profiles?.username || "runner"} ·{" "}
              {formatDate(activity.created_at)}
            </p>
          </Link>
        </div>
        <span className="ml-auto border border-caramel/25 bg-wine/35 px-3 py-1 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-caramel">
          {activity.type}
        </span>
      </div>

      {/* Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card p-3">
            <MapPin size={15} className="mb-2 text-caramel" />
            <p className="display-title text-2xl text-cream">
              {formatDistance(activity.distance)}
            </p>
            <p className="font-secondary text-[9px] uppercase tracking-[0.15em] text-wool/42">
              Distancia
            </p>
          </div>
          <div className="metric-card p-3">
            <Clock size={15} className="mb-2 text-caramel" />
            <p className="display-title text-2xl text-cream">
              {formatDuration(activity.duration)}
            </p>
            <p className="font-secondary text-[9px] uppercase tracking-[0.15em] text-wool/42">
              Tiempo
            </p>
          </div>
          <div className="metric-card p-3">
            <Zap size={15} className="mb-2 text-caramel" />
            <p className="display-title text-2xl text-caramel">
              {formatPace(activity.avg_pace)}
            </p>
            <p className="font-secondary text-[9px] uppercase tracking-[0.15em] text-wool/42">
              Ritmo/km
            </p>
          </div>
        </div>

        {activity.notes && (
          <p className="mt-4 border-l-2 border-caramel/55 pl-3 font-secondary text-sm leading-6 text-wool/72">
            {activity.notes}
          </p>
        )}

        {/* Activity Photos */}
        {photos.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {photos.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setPhotoModalUrl(url)}
                className="shrink-0 h-20 w-20 overflow-hidden border border-wool/15 hover:border-caramel/50 transition-colors"
              >
                <img
                  src={url}
                  alt={`Foto ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Photo Modal */}
        {photoModalUrl && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setPhotoModalUrl(null)}
          >
            <img
              src={photoModalUrl}
              alt="Foto ampliada"
              className="max-h-[85vh] max-w-full object-contain"
            />
            <button
              className="absolute top-4 right-4 text-cream/70 hover:text-cream text-2xl"
              onClick={() => setPhotoModalUrl(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Action bar */}
        <div className="mt-4 flex items-center gap-5 border-t border-wool/10 pt-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 font-secondary text-xs font-semibold transition-colors"
            aria-pressed={activity.likedByMe}
          >
            <Heart
              size={16}
              className={`transition-colors ${bouncing ? "like-bounce" : ""} ${
                activity.likedByMe
                  ? "fill-red-500 text-red-500"
                  : "text-wool/44 hover:text-red-400"
              }`}
            />
            <span className={activity.likedByMe ? "text-red-400" : "text-wool/44"}>
              {activity.likeCount > 0 ? activity.likeCount : "Me gusta"}
            </span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 font-secondary text-xs font-semibold transition-colors ${
              showComments ? "text-caramel" : "text-wool/44 hover:text-caramel"
            }`}
          >
            <MessageCircle size={16} />
            <span>
              {activity.commentCount > 0
                ? `${activity.commentCount} comentario${activity.commentCount !== 1 ? "s" : ""}`
                : "Comentar"}
            </span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <CommentSection
          activityId={activity.id}
          userId={userId}
          onCommentAdded={() => onCommentAdded(activity.id)}
        />
      )}
    </article>
  );
}

/* ─────────────────────────── Comment Section ──────────────────────────── */

function CommentSection({
  activityId,
  userId,
  onCommentAdded,
  kind = "activity",
}: {
  activityId: string;
  userId: string;
  onCommentAdded: () => void;
  kind?: "activity" | "post";
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchComments = async () => {
      const table = kind === "post" ? "post_comments" : "comments";
      const idColumn = kind === "post" ? "post_id" : "activity_id";
      const { data } = await supabase
        .from(table)
        .select("*, profiles(full_name, username, avatar_url)")
        .eq(idColumn, activityId)
        .order("created_at", { ascending: true });

      if (data) setComments(data as Comment[]);
      setLoading(false);
    };
    fetchComments();

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [activityId, supabase, kind]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || sending) return;

    setSending(true);

    const table = kind === "post" ? "post_comments" : "comments";
    const idColumn = kind === "post" ? "post_id" : "activity_id";
    const { data, error } = await supabase
      .from(table)
      .insert({
        user_id: userId,
        [idColumn]: activityId,
        content: trimmed,
      })
      .select("*, profiles(full_name, username, avatar_url)")
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setNewComment("");
      onCommentAdded();
    }
    setSending(false);
  };

  return (
    <div className="comment-section px-4 py-3">
      {loading ? (
        <p className="py-3 text-center font-secondary text-xs text-wool/38 animate-pulse">
          Cargando comentarios...
        </p>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="mb-3 max-h-52 space-y-3 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-caramel/20 bg-chestnut/70">
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

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 border border-wool/12 bg-dark/40 px-3 py-2 font-secondary text-xs text-cream outline-none transition-colors placeholder:text-wool/32 focus:border-caramel/50"
              aria-label="Escribir comentario"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-wool/12 bg-wine/40 text-caramel transition-colors hover:bg-wine/60 disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
