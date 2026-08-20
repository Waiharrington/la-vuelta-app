"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  Flame,
  Zap,
  Target,
  Award,
  ChevronRight,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDuration, formatPace } from "@/lib/utils";
import { StatsCardSkeleton, Skeleton } from "@/components/skeleton";

interface Activity {
  id: string;
  type: string;
  distance: number;
  duration: number;
  avg_pace: number;
  calories: number;
  created_at: string;
}

interface WeekData {
  label: string;
  distance: number;
  runs: number;
}

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setActivities(data as Activity[]);
      setLoading(false);
    };

    fetchActivities();
  }, [user, supabase]);

  if (authLoading || loading) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <div className="brand-panel mb-5 p-5 sm:p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-12 w-48" />
            </div>
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>
            <div className="brand-panel mb-5 p-5">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const now = new Date();
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const filtered = activities.filter((a) => {
    const d = new Date(a.created_at);
    if (period === "week") return d >= startOfWeek;
    if (period === "month") return d >= startOfMonth;
    return d >= startOfYear;
  });

  const totalDistance = filtered.reduce((s, a) => s + a.distance, 0);
  const totalDuration = filtered.reduce((s, a) => s + a.duration, 0);
  const totalCalories = filtered.reduce((s, a) => s + (a.calories || 0), 0);
  const avgPace =
    filtered.length > 0
      ? filtered.reduce((s, a) => s + a.avg_pace, 0) / filtered.length
      : 0;

  // Build weekly chart data (last 8 weeks)
  const weeklyData: WeekData[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const ws = getStartOfWeek(weekStart);
    const we = new Date(ws);
    we.setDate(we.getDate() + 7);

    const weekActs = activities.filter((a) => {
      const d = new Date(a.created_at);
      return d >= ws && d < we;
    });

    weeklyData.push({
      label: `${ws.getDate()}/${ws.getMonth() + 1}`,
      distance: weekActs.reduce((s, a) => s + a.distance, 0),
      runs: weekActs.length,
    });
  }

  const maxDistance = Math.max(...weeklyData.map((w) => w.distance), 1);

  // Streak calculation
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const hasRun = activities.some((a) => {
      const d = new Date(a.created_at);
      return d.toDateString() === checkDate.toDateString();
    });
    if (hasRun) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Best week
  const bestWeek = weeklyData.reduce(
    (best, w) => (w.distance > best.distance ? w : best),
    weeklyData[0]
  );

  // Personal records
  const longestRun = activities.reduce(
    (best, a) => (a.distance > best.distance ? a : best),
    activities[0]
  );
  const fastestPace = activities.reduce(
    (best, a) => (a.avg_pace > best.avg_pace ? a : best),
    activities[0]
  );

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <section className="brand-panel mb-5 p-5 sm:p-6">
            <p className="section-kicker mb-3">Tus métricas</p>
            <h1 className="display-title text-5xl text-cream sm:text-7xl">
              Estadísticas.
            </h1>
          </section>

          {/* Period selector */}
          <div className="mb-5 flex gap-2">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2.5 font-secondary text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
                  period === p
                    ? "border border-caramel/40 bg-wine/35 text-caramel"
                    : "border border-wool/10 bg-dark/30 text-wool/45 hover:text-wool"
                }`}
              >
                {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="metric-card p-4">
              <TrendingUp size={18} className="mb-2 text-caramel" />
              <p className="display-title text-3xl text-cream">
                {formatDistance(totalDistance)}
              </p>
              <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Distancia
              </p>
            </div>
            <div className="metric-card p-4">
              <Calendar size={18} className="mb-2 text-caramel" />
              <p className="display-title text-3xl text-cream">
                {filtered.length}
              </p>
              <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Carreras
              </p>
            </div>
            <div className="metric-card p-4">
              <Zap size={18} className="mb-2 text-caramel" />
              <p className="display-title text-3xl text-caramel">
                {avgPace > 0 ? formatPace(1000 / avgPace) : "0:00"}
              </p>
              <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Ritmo medio
              </p>
            </div>
            <div className="metric-card p-4">
              <Flame size={18} className="mb-2 text-caramel" />
              <p className="display-title text-3xl text-cream">
                {totalCalories}
              </p>
              <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Calorías
              </p>
            </div>
          </section>

          {/* Weekly Chart */}
          <section className="brand-panel mb-5 p-5">
            <p className="section-kicker mb-4">Últimas 8 semanas</p>
            <div className="flex items-end gap-2" style={{ height: 160 }}>
              {weeklyData.map((week, i) => {
                const height =
                  week.distance > 0
                    ? Math.max(8, (week.distance / maxDistance) * 140)
                    : 4;
                return (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <p className="font-secondary text-[10px] text-wool/42">
                      {week.runs > 0 ? formatDistance(week.distance) : ""}
                    </p>
                    <div
                      className={`w-full transition-all ${
                        i === weeklyData.length - 1
                          ? "bg-caramel"
                          : "bg-wine/60 hover:bg-wine/80"
                      }`}
                      style={{ height }}
                    />
                    <p className="font-secondary text-[9px] text-wool/38">
                      {week.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Streak + Records */}
          <section className="mb-5 grid gap-3 lg:grid-cols-2">
            {/* Streak */}
            <div className="brand-panel p-5">
              <div className="flex items-center gap-3 mb-3">
                <Target size={20} className="text-caramel" />
                <p className="section-kicker">Racha activa</p>
              </div>
              <p className="display-title text-6xl text-caramel">{streak}</p>
              <p className="font-secondary text-sm text-wool/58">
                {streak === 1 ? "día consecutivo" : "días consecutivos"}
              </p>
              <div className="mt-4 flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const checkDate = new Date(today);
                  checkDate.setDate(checkDate.getDate() - (6 - i));
                  const hasRun = activities.some(
                    (a) =>
                      new Date(a.created_at).toDateString() ===
                      checkDate.toDateString()
                  );
                  return (
                    <div
                      key={i}
                      className={`h-3 flex-1 ${
                        hasRun ? "bg-caramel" : "bg-wool/15"
                      }`}
                    />
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between">
                <p className="font-secondary text-[9px] text-wool/32">
                  Lun
                </p>
                <p className="font-secondary text-[9px] text-wool/32">
                  Dom
                </p>
              </div>
            </div>

            {/* Personal Records */}
            <div className="brand-panel p-5">
              <div className="flex items-center gap-3 mb-4">
                <Award size={20} className="text-caramel" />
                <p className="section-kicker">Records personales</p>
              </div>
              <div className="space-y-3">
                {longestRun && (
                  <div className="flex items-center justify-between border-b border-wool/8 pb-3">
                    <div>
                      <p className="font-secondary text-[10px] text-wool/42">
                        Carrera más larga
                      </p>
                      <p className="font-secondary text-lg font-bold text-cream">
                        {formatDistance(longestRun.distance)}
                      </p>
                    </div>
                    <Link
                      href={`/activities/${longestRun.id}`}
                      className="text-wool/30 hover:text-caramel"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                )}
                {fastestPace && (
                  <div className="flex items-center justify-between border-b border-wool/8 pb-3">
                    <div>
                      <p className="font-secondary text-[10px] text-wool/42">
                        Mejor ritmo promedio
                      </p>
                      <p className="font-secondary text-lg font-bold text-caramel">
                        {formatPace(fastestPace.avg_pace)} /km
                      </p>
                    </div>
                    <Link
                      href={`/activities/${fastestPace.id}`}
                      className="text-wool/30 hover:text-caramel"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                )}
                {bestWeek && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-secondary text-[10px] text-wool/42">
                        Mejor semana
                      </p>
                      <p className="font-secondary text-lg font-bold text-cream">
                        {formatDistance(bestWeek.distance)} ({bestWeek.runs}{" "}
                        {bestWeek.runs === 1 ? "carrera" : "carreras"})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Recent Activity Timeline */}
          <section className="brand-panel p-5">
            <p className="section-kicker mb-4">
              Actividad reciente ({filtered.length} carreras)
            </p>
            {filtered.length === 0 ? (
              <p className="py-8 text-center font-secondary text-sm text-wool/42">
                Sin actividades en este período
              </p>
            ) : (
              <div className="space-y-2">
                {filtered.slice(0, 10).map((act) => (
                  <Link key={act.id} href={`/activities/${act.id}`}>
                    <div className="flex items-center justify-between border-b border-wool/8 py-2.5 last:border-0 transition hover:bg-wool/5 -mx-2 px-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 ${
                            act.avg_pace > 0 ? "bg-caramel" : "bg-wool/30"
                          }`}
                        />
                        <div>
                          <p className="font-secondary text-sm font-bold text-cream">
                            {formatDistance(act.distance)}
                          </p>
                          <p className="font-secondary text-[10px] text-wool/42">
                            {new Date(act.created_at).toLocaleDateString(
                              "es-ES",
                              { weekday: "short", day: "numeric", month: "short" }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-secondary text-sm text-caramel">
                          {formatPace(act.avg_pace)} /km
                        </p>
                        <p className="font-secondary text-[10px] text-wool/42">
                          {formatDuration(act.duration)}
                        </p>
                      </div>
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
