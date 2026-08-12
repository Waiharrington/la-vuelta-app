"use client";

import { useEffect, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  total_distance: number;
  total_runs: number;
  avg_pace: number;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const supabase = createClient();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_period: period,
        p_limit: 20,
      });

      if (!error && data) {
        setLeaders(data as LeaderboardEntry[]);
      } else {
        setLeaders([]);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [period, supabase]);

  const getMedalClass = (index: number) => {
    if (index === 0) return "text-yellow-300";
    if (index === 1) return "text-zinc-200";
    if (index === 2) return "text-amber-600";
    return "text-wool/36";
  };

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-4xl">
          <section className="brand-panel mb-5 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border border-caramel/30 bg-wine/30">
                <Trophy size={24} className="text-caramel" />
              </div>
              <div>
                <p className="section-kicker">Ranking</p>
                <h1 className="display-title text-5xl text-cream sm:text-7xl">
                  La tabla.
                </h1>
              </div>
            </div>

            <div className="flex gap-2">
              {[
                { key: "week" as const, label: "Semana" },
                { key: "month" as const, label: "Mes" },
                { key: "all" as const, label: "Todo" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPeriod(item.key)}
                  className={cn(
                    "border px-4 py-2 font-secondary text-xs font-bold uppercase tracking-[0.14em] transition",
                    period === item.key
                      ? "border-wool bg-cream text-fire"
                      : "border-wool/18 bg-dark/22 text-wool/58 hover:border-wool/38 hover:text-cream"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {loading ? (
            <div className="brand-panel py-16 text-center">
              <div className="display-title text-2xl text-cream animate-pulse">
                CARGANDO...
              </div>
            </div>
          ) : leaders.length === 0 ? (
            <div className="brand-panel px-5 py-16 text-center">
              <Trophy size={42} className="mx-auto mb-4 text-wool/22" />
              <p className="display-title text-4xl text-cream">
                No hay actividad en este período
              </p>
              <p className="mt-2 font-secondary text-sm text-wool/58">
                La próxima vuelta puede abrir el ranking.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaders.map((entry, index) => (
                <article
                  key={entry.user_id}
                  className={cn(
                    "activity-card flex items-center gap-3 p-4",
                    entry.user_id === user?.id
                      ? "border border-caramel/45 bg-wine/32"
                      : "brand-panel"
                  )}
                >
                  <div className="w-10 text-center">
                    {index < 3 ? (
                      <Medal size={24} className={cn("mx-auto", getMedalClass(index))} />
                    ) : (
                      <span className="display-title text-2xl text-wool/38">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-caramel/28 bg-chestnut">
                    <span className="font-display text-base text-cream">
                      {entry.full_name?.charAt(0) || "U"}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-secondary text-sm font-bold text-cream">
                      {entry.full_name || "Runner"}
                      {entry.user_id === user?.id && (
                        <span className="ml-1 text-caramel">(Tú)</span>
                      )}
                    </p>
                    <p className="font-secondary text-xs text-wool/42">
                      @{entry.username || "runner"} · {entry.total_runs} carreras
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="display-title text-3xl text-caramel">
                      {formatDistance(entry.total_distance)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
