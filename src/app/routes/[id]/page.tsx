"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, Clock, Share2, User } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDuration, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/skeleton";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-dark/70">
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

export default function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [route, setRoute] = useState<SavedRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRoute = async () => {
      const { data } = await supabase
        .from("saved_routes")
        .select("*, profiles(full_name, username)")
        .eq("id", id)
        .single();

      setRoute(data as SavedRoute | null);
      setLoading(false);
    };

    fetchRoute();
  }, [id, supabase]);

  const handleShare = async () => {
    if (!route) return;
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
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <Skeleton className="h-10 w-24 mb-5" />
            <div className="brand-panel p-5 sm:p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/routes"
              className="mb-5 flex items-center gap-2 font-secondary text-sm text-wool/58 hover:text-cream"
            >
              <ArrowLeft size={16} />
              Volver a rutas
            </Link>
            <div className="brand-panel px-5 py-16 text-center">
              <p className="display-title text-4xl text-cream">
                Ruta no encontrada
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const positions = route.route_coordinates || [];

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/routes"
            className="mb-5 flex items-center gap-2 font-secondary text-sm text-wool/58 hover:text-cream"
          >
            <ArrowLeft size={16} />
            Volver a rutas
          </Link>

          <section className="brand-panel mb-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-kicker mb-2">Detalle de ruta</p>
                <h1 className="display-title text-5xl text-cream sm:text-7xl">
                  {route.name}
                </h1>
              </div>
              <button
                onClick={handleShare}
                className="brand-button flex shrink-0 items-center gap-2 px-4 py-2 text-xs"
              >
                <Share2 size={14} />
                Compartir
              </button>
            </div>

            {route.profiles && (
              <Link
                href={`/users/${route.user_id}`}
                className="mt-4 flex items-center gap-2 transition hover:opacity-80"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
                  <User size={14} className="text-cream" />
                </div>
                <span className="font-secondary text-sm text-cream">
                  {route.profiles.full_name}
                </span>
                <span className="font-secondary text-[10px] text-wool/42">
                  @{route.profiles.username}
                </span>
              </Link>
            )}

            {route.description && (
              <p className="mt-4 border-l-2 border-caramel/55 pl-3 font-secondary text-sm leading-6 text-wool/72">
                {route.description}
              </p>
            )}
          </section>

          {positions.length > 1 && (
            <section className="brand-panel mb-5 overflow-hidden">
              <div className="h-64">
                <MapView positions={positions as any} />
              </div>
            </section>
          )}

          <section className="brand-panel p-5 sm:p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <MapPin size={20} className="mx-auto mb-2 text-caramel" />
                <p className="font-secondary text-lg font-bold text-cream">
                  {formatDistance(route.distance)}
                </p>
                <p className="font-secondary text-[10px] text-wool/42">
                  Distancia
                </p>
              </div>
              {route.duration && (
                <div className="text-center">
                  <Clock size={20} className="mx-auto mb-2 text-wool/42" />
                  <p className="font-secondary text-lg font-bold text-cream">
                    {formatDuration(route.duration)}
                  </p>
                  <p className="font-secondary text-[10px] text-wool/42">
                    Duración
                  </p>
                </div>
              )}
              <div className="text-center">
                <p className="font-secondary text-lg font-bold text-cream">
                  {formatDate(route.created_at)}
                </p>
                <p className="font-secondary text-[10px] text-wool/42">
                  Creada
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
