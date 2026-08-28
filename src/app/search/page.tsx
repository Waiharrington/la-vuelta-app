"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, MapPin, Calendar, ChevronRight } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDate } from "@/lib/utils";

interface ProfileResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
}

interface ActivityResult {
  id: string;
  user_id: string;
  type: string;
  distance: number;
  duration: number;
  notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
  } | null;
}

type Tab = "people" | "activities";

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("people");
  const [peopleResults, setPeopleResults] = useState<ProfileResult[]>([]);
  const [activityResults, setActivityResults] = useState<ActivityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const searchPeople = useCallback(
    async (term: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, location, bio")
        .or(`full_name.ilike.%${term}%,username.ilike.%${term}%`)
        .limit(20);
      setPeopleResults((data as ProfileResult[]) || []);
    },
    [supabase]
  );

  const searchActivities = useCallback(
    async (term: string) => {
      const { data } = await supabase
        .from("activities")
        .select("id, user_id, type, distance, duration, notes, created_at, profiles(full_name, username)")
        .eq("is_public", true)
        .ilike("notes", `%${term}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      setActivityResults((data as unknown as ActivityResult[]) || []);
    },
    [supabase]
  );

  const performSearch = useCallback(
    (term: string) => {
      if (!term.trim()) {
        setPeopleResults([]);
        setActivityResults([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      setSearched(true);

      if (activeTab === "people") {
        searchPeople(term).finally(() => setLoading(false));
      } else {
        searchActivities(term).finally(() => setLoading(false));
      }
    },
    [activeTab, searchPeople, searchActivities]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  useEffect(() => {
    if (query.trim()) {
      performSearch(query);
    }
  }, [activeTab, performSearch, query]);

  if (authLoading) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <div className="brand-panel p-5 sm:p-6">
              <p className="section-kicker mb-3">Buscar</p>
              <h1 className="display-title text-5xl text-cream animate-pulse">CARGANDO...</h1>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const results = activeTab === "people" ? peopleResults : activityResults;

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          <section className="mb-5 overflow-hidden border border-wool/10 bg-wine/88 py-3">
            <div className="px-4">
              <p className="display-title text-lg text-wool/80">
                BUSCAR {"//"} CORREDORES Y ACTIVIDADES
              </p>
            </div>
          </section>

          <div className="brand-panel mb-5 p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wool/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, usuario o notas..."
                autoFocus
                className="brand-input w-full pl-10 pr-4 py-2.5 text-sm"
                aria-label="Buscar"
              />
            </div>
          </div>

          <div className="mb-5 flex border-b border-wool/10">
            {(["people", "activities"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center font-secondary text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-caramel text-cream"
                    : "text-wool/40 hover:text-wool/60"
                }`}
              >
                {tab === "people" ? "Personas" : "Actividades"}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="brand-panel animate-pulse p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-wine/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-wine/50" />
                      <div className="h-3 w-20 rounded bg-wine/50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="brand-panel px-5 py-16 text-center">
              <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-caramel/30 bg-dark/45">
                <Search size={28} className="text-caramel" />
              </div>
              <p className="display-title text-4xl text-cream">
                No se encontraron resultados
              </p>
              <p className="mx-auto mt-2 max-w-sm font-secondary text-sm text-wool/58">
                Intenta con otro término de búsqueda.
              </p>
            </div>
          )}

          {!loading && !searched && (
            <div className="brand-panel px-5 py-16 text-center">
              <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-caramel/30 bg-dark/45">
                <Search size={28} className="text-caramel" />
              </div>
              <p className="display-title text-4xl text-cream">
                Busca corredores o actividades
              </p>
              <p className="mx-auto mt-2 max-w-sm font-secondary text-sm text-wool/58">
                Escribí un nombre, usuario o palabra clave para encontrar lo que buscás.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {activeTab === "people"
                ? peopleResults.map((person) => (
                    <Link key={person.id} href={`/users/${person.id}`}>
                      <article className="brand-panel flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
                          <span className="font-display text-base text-cream">
                            {person.full_name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-secondary text-sm font-bold text-cream">
                            {person.full_name || "Runner"}
                          </p>
                          <p className="font-secondary text-xs text-caramel">
                            @{person.username || "runner"}
                          </p>
                          {person.location && (
                            <p className="mt-0.5 flex items-center gap-1 font-secondary text-[10px] text-wool/42">
                              <MapPin size={10} />
                              {person.location}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-wool/22" />
                      </article>
                    </Link>
                  ))
                : activityResults.map((activity) => (
                    <article key={activity.id} className="brand-panel overflow-hidden">
                      <div className="flex items-start gap-3 border-b border-wool/10 p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
                          <span className="font-display text-base text-cream">
                            {activity.profiles?.full_name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-secondary text-sm font-bold text-cream">
                            {activity.profiles?.full_name || "Runner"}
                          </p>
                          <p className="flex items-center gap-2 font-secondary text-xs text-wool/42">
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(activity.created_at)}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 border border-caramel/25 bg-wine/35 px-3 py-1 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-caramel">
                          {activity.type}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="metric-card px-3 py-2">
                            <p className="display-title text-lg text-cream">
                              {formatDistance(activity.distance)}
                            </p>
                            <p className="font-secondary text-[9px] uppercase tracking-[0.15em] text-wool/42">
                              Distancia
                            </p>
                          </div>
                        </div>
                        {activity.notes && (
                          <p className="mt-3 border-l-2 border-caramel/55 pl-3 font-secondary text-sm leading-6 text-wool/72 line-clamp-2">
                            {activity.notes}
                          </p>
                        )}
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
