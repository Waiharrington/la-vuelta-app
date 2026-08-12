"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, Flame, MapPin, Plus, TrendingUp, Zap } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDuration, formatPace, formatDate } from "@/lib/utils";

interface Activity {
  id: string;
  type: string;
  distance: number;
  duration: number;
  avg_pace: number;
  calories: number;
  notes: string;
  created_at: string;
}

export default function ActivitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalRuns: 0,
    avgPace: 0,
    totalCalories: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setActivities(data as Activity[]);
        const totalDist = data.reduce((sum, activity) => sum + activity.distance, 0);
        const totalCals = data.reduce(
          (sum, activity) => sum + (activity.calories || 0),
          0
        );
        const avgP =
          data.length > 0
            ? data.reduce((sum, activity) => sum + activity.avg_pace, 0) / data.length
            : 0;
        setStats({
          totalDistance: totalDist,
          totalRuns: data.length,
          avgPace: avgP,
          totalCalories: totalCals,
        });
      }
      setLoading(false);
    };

    fetchActivities();
  }, [user, supabase]);

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
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          <section className="brand-panel mb-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker mb-3">Tu bitácora</p>
                <h1 className="display-title text-5xl text-cream sm:text-7xl">
                  Mis actividades.
                </h1>
              </div>
              <Link href="/tracker" className="brand-button shrink-0 px-4">
                <Plus size={18} />
                <span className="hidden sm:inline">Nueva</span>
              </Link>
            </div>
          </section>

          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                label: "Total",
                value: formatDistance(stats.totalDistance),
                accent: false,
              },
              { icon: MapPin, label: "Carreras", value: stats.totalRuns, accent: false },
              {
                icon: Zap,
                label: "Ritmo medio",
                value: stats.avgPace > 0 ? formatPace(1000 / stats.avgPace) : "0:00",
                accent: true,
              },
              { icon: Flame, label: "Calorías", value: stats.totalCalories, accent: false },
            ].map((item) => (
              <div key={item.label} className="metric-card p-4">
                <item.icon size={18} className="mb-3 text-caramel" />
                <p className={`display-title text-3xl ${item.accent ? "text-caramel" : "text-cream"}`}>
                  {item.value}
                </p>
                <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                  {item.label}
                </p>
              </div>
            ))}
          </section>

          {activities.length === 0 ? (
            <div className="brand-panel px-5 py-16 text-center">
              <p className="display-title text-4xl text-cream">
                Aún no tienes actividades
              </p>
              <p className="mx-auto mt-2 max-w-sm font-secondary text-sm text-wool/58">
                Graba tu primera vuelta y empieza a construir tu historial.
              </p>
              <Link href="/tracker" className="brand-button mt-7">
                Primera carrera
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Link key={activity.id} href={`/activities/${activity.id}`}>
                  <article className="activity-card brand-panel p-4 transition hover:-translate-y-0.5 hover:border-caramel/30">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <span className="border border-caramel/25 bg-wine/35 px-3 py-1 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-caramel">
                        {activity.type}
                      </span>
                      <p className="mt-2 font-secondary text-xs text-wool/42">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                    <Clock size={18} className="text-caramel" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="display-title text-3xl text-cream">
                        {formatDistance(activity.distance)}
                      </p>
                      <p className="font-secondary text-[10px] uppercase tracking-[0.15em] text-wool/42">
                        Distancia
                      </p>
                    </div>
                    <div className="border-x border-wool/10 text-center">
                      <p className="display-title text-3xl text-cream">
                        {formatDuration(activity.duration)}
                      </p>
                      <p className="font-secondary text-[10px] uppercase tracking-[0.15em] text-wool/42">
                        Tiempo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="display-title text-3xl text-caramel">
                        {formatPace(activity.avg_pace)}
                      </p>
                      <p className="font-secondary text-[10px] uppercase tracking-[0.15em] text-wool/42">
                        Ritmo/km
                      </p>
                    </div>
                  </div>

                  {activity.notes && (
                    <p className="mt-4 border-t border-wool/10 pt-3 font-secondary text-sm leading-6 text-wool/66">
                      {activity.notes}
                    </p>
                  )}
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
