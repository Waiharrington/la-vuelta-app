"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Clock,
  Plus,
  Route,
  Share2,
  Trash2,
  Users,
  Navigation,
} from "lucide-react";
import { Navigation as NavComponent } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDuration, formatDate } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center bg-dark/70">
      <p className="font-secondary text-sm text-wool/45">Cargando mapa...</p>
    </div>
  ),
});

interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  distance: number;
  duration: number | null;
  route_coordinates: { lat: number; lng: number; timestamp: number }[];
  is_public: boolean;
  use_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

export default function RoutesPage() {
  const { user, loading: authLoading } = useAuth();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [publicRoutes, setPublicRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "community">("my");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchRoutes = async () => {
      const { data: myRoutes } = await supabase
        .from("saved_routes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data: pubRoutes } = await supabase
        .from("saved_routes")
        .select("*, profiles(full_name, username)")
        .eq("is_public", true)
        .order("use_count", { ascending: false })
        .limit(20);

      if (myRoutes) setRoutes(myRoutes as SavedRoute[]);
      if (pubRoutes) setPublicRoutes(pubRoutes as SavedRoute[]);
      setLoading(false);
    };

    fetchRoutes();
  }, [user, supabase]);

  const handleSaveFromActivity = async (activityId: string) => {
    if (!user) return;

    const { data: activity } = await supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .single();

    if (!activity) return;

    setSaving(true);
    const { error } = await supabase.from("saved_routes").insert({
      user_id: user.id,
      name: newName || `Ruta ${new Date(activity.created_at).toLocaleDateString("es-ES")}`,
      description: newDesc || null,
      distance: activity.distance,
      duration: activity.duration,
      route_coordinates: activity.route_coordinates,
      is_public: true,
    });

    if (!error) {
      const { data: updated } = await supabase
        .from("saved_routes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (updated) setRoutes(updated as SavedRoute[]);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    }
    setSaving(false);
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm("¿Eliminar esta ruta?")) return;
    await supabase.from("saved_routes").delete().eq("id", routeId);
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
  };

  const handleShare = async (route: SavedRoute) => {
    const url = `${window.location.origin}/routes/${route.id}`;
    if (navigator.share) {
      await navigator.share({
        title: route.name,
        text: `${route.name} - ${formatDistance(route.distance)}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copiado");
    }
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

  return (
    <div className="app-shell">
      <NavComponent />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <section className="brand-panel mb-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker mb-3">Tus rutas</p>
                <h1 className="display-title text-5xl text-cream sm:text-7xl">
                  Rutas.
                </h1>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="brand-button shrink-0 px-4"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nueva</span>
              </button>
            </div>
          </section>

          {/* Tab selector */}
          <div className="mb-5 flex gap-2">
            <button
              onClick={() => setTab("my")}
              className={`flex-1 py-2.5 font-secondary text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
                tab === "my"
                  ? "border border-caramel/40 bg-wine/35 text-caramel"
                  : "border border-wool/10 bg-dark/30 text-wool/45 hover:text-wool"
              }`}
            >
              Mis rutas
            </button>
            <button
              onClick={() => setTab("community")}
              className={`flex-1 py-2.5 font-secondary text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
                tab === "community"
                  ? "border border-caramel/40 bg-wine/35 text-caramel"
                  : "border border-wool/10 bg-dark/30 text-wool/45 hover:text-wool"
              }`}
            >
              <Users size={14} className="inline mr-1" />
              Comunidad
            </button>
          </div>

          {/* Create from activity */}
          {showCreate && (
            <div className="brand-panel mb-5 p-5">
              <p className="section-kicker mb-3">Guardar ruta</p>
              <p className="font-secondary text-sm text-wool/58 mb-4">
                Selecciona una actividad para guardar como ruta
              </p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre de la ruta"
                className="brand-input mb-3"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                rows={2}
                className="brand-input mb-3 resize-none"
              />
              <ActivitySelector
                userId={user?.id || ""}
                onSelect={handleSaveFromActivity}
                saving={saving}
              />
            </div>
          )}

          {/* Routes list */}
          {tab === "my" ? (
            routes.length === 0 ? (
              <div className="brand-panel px-5 py-16 text-center">
                <Route size={32} className="mx-auto mb-4 text-wool/30" />
                <p className="display-title text-3xl text-cream">
                  No tienes rutas guardadas
                </p>
                <p className="mx-auto mt-2 max-w-sm font-secondary text-sm text-wool/58">
                  Guarda tus actividades favoritas como rutas para reutilizarlas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isOwner={true}
                    onDelete={handleDelete}
                    onShare={handleShare}
                  />
                ))}
              </div>
            )
          ) : publicRoutes.length === 0 ? (
            <div className="brand-panel px-5 py-16 text-center">
              <Users size={32} className="mx-auto mb-4 text-wool/30" />
              <p className="display-title text-3xl text-cream">
                No hay rutas públicas
              </p>
              <p className="mx-auto mt-2 max-w-sm font-secondary text-sm text-wool/58">
                Sé el primero en compartir una ruta con la comunidad.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {publicRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isOwner={route.user_id === user?.id}
                  onDelete={handleDelete}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RouteCard({
  route,
  isOwner,
  onDelete,
  onShare,
}: {
  route: SavedRoute;
  isOwner: boolean;
  onDelete: (id: string) => void;
  onShare: (route: SavedRoute) => void;
}) {
  const positions = route.route_coordinates || [];

  return (
    <article className="brand-panel overflow-hidden">
      {positions.length > 1 && (
        <div className="h-48">
          <MapView positions={positions as any} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-secondary text-base font-bold text-cream">
              {route.name}
            </h3>
            {route.profiles && (
              <p className="font-secondary text-[10px] text-wool/42">
                por {route.profiles.full_name} · {formatDate(route.created_at)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onShare(route)}
              className="text-wool/30 hover:text-caramel"
            >
              <Share2 size={16} />
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(route.id)}
                className="text-wool/30 hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {route.description && (
          <p className="font-secondary text-sm text-wool/58 mb-3">
            {route.description}
          </p>
        )}

        <div className="flex items-center gap-4 border-t border-wool/10 pt-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-caramel" />
            <span className="font-secondary text-sm text-cream">
              {formatDistance(route.distance)}
            </span>
          </div>
          {route.duration && (
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-wool/42" />
              <span className="font-secondary text-sm text-wool/60">
                {formatDuration(route.duration)}
              </span>
            </div>
          )}
          {route.use_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Navigation size={14} className="text-wool/42" />
              <span className="font-secondary text-sm text-wool/60">
                {route.use_count} usos
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ActivitySelector({
  userId,
  onSelect,
  saving,
}: {
  userId: string;
  onSelect: (id: string) => void;
  saving: boolean;
}) {
  const [activities, setActivities] = useState<
    { id: string; type: string; distance: number; created_at: string }[]
  >([]);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("activities")
        .select("id, type, distance, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setActivities(data);
    };
    fetch();
  }, [userId, supabase]);

  if (activities.length === 0) {
    return (
      <p className="py-4 text-center font-secondary text-sm text-wool/42">
        No tienes actividades para guardar
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((act) => (
        <button
          key={act.id}
          onClick={() => onSelect(act.id)}
          disabled={saving}
          className="flex w-full items-center justify-between border border-wool/10 bg-dark/30 p-3 transition hover:border-caramel/30 hover:bg-wine/15 disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-caramel" />
            <div className="text-left">
              <p className="font-secondary text-sm font-bold text-cream">
                {formatDistance(act.distance)}
              </p>
              <p className="font-secondary text-[10px] text-wool/42">
                {formatDate(act.created_at)}
              </p>
            </div>
          </div>
          <span className="font-secondary text-xs text-caramel">
            {saving ? "Guardando..." : "Guardar como ruta"}
          </span>
        </button>
      ))}
    </div>
  );
}
