"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  MapPin,
  Target,
  Users,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDistance } from "@/lib/utils";
import { Skeleton } from "@/components/skeleton";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location_name: string;
  location_lat: number | null;
  location_lng: number | null;
  distance_target: number | null;
  created_by: string;
  created_at: string;
  club_id: string | null;
  clubs?: { name: string } | null;
  participant_count: number;
  my_status: "going" | "maybe" | "not_going" | null;
}

interface RawEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location_name: string;
  location_lat: number | null;
  location_lng: number | null;
  distance_target: number | null;
  created_by: string;
  created_at: string;
  club_id: string | null;
  clubs: { name: string } | null;
  event_participants: { status: string; user_id: string }[];
}

type Tab = "upcoming" | "mine" | "past";

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    const now = new Date().toISOString();

    // Fetch all events with participant count and user's RSVP
    const { data: eventsData } = await supabase
      .from("events")
      .select(`
        *,
        clubs(name),
        event_participants(status, user_id)
      `)
      .order("event_date", { ascending: true });

    if (!eventsData) {
      setLoading(false);
      return;
    }

    // Process events with participant counts
    const processed: Event[] = eventsData.map((event: RawEvent) => {
      const participants = event.event_participants || [];
      return {
        ...event,
        clubs: event.clubs,
        participant_count: participants.length,
        my_status:
          (participants.find((p: { status: string; user_id: string }) => p.user_id === user.id)?.status as Event['my_status']) || null,
      };
    });

    setEvents(processed);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    const now = new Date();

    if (tab === "upcoming") return eventDate >= now;
    if (tab === "past") return eventDate < now;
    // mine
    return event.created_by === user?.id;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <div className="brand-panel mb-5 p-5 sm:p-6">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-12 w-48" />
            </div>
            <div className="flex gap-2 mb-5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 flex-1" />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
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
          {/* Header */}
          <section className="brand-panel mb-5 p-5 sm:p-6">
            <p className="section-kicker mb-3">Próximos eventos</p>
            <h1 className="display-title text-5xl text-cream sm:text-7xl">
              Eventos.
            </h1>
          </section>

          {/* Tabs */}
          <div className="mb-5 flex gap-2">
            {([
              { key: "upcoming", label: "Próximos" },
              { key: "mine", label: "Mis Eventos" },
              { key: "past", label: "Pasados" },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 font-secondary text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
                  tab === t.key
                    ? "border border-caramel/40 bg-wine/35 text-caramel"
                    : "border border-wool/10 bg-dark/30 text-wool/45 hover:text-wool"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Create Event Button */}
          <Link
            href="/events/new"
            className="brand-button mb-5 flex w-full items-center justify-center gap-2 py-3"
          >
            <Plus size={18} />
            Crear Evento
          </Link>

          {/* Events List */}
          {filteredEvents.length === 0 ? (
            <div className="brand-panel px-5 py-16 text-center">
              <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-caramel/30 bg-dark/45">
                <Calendar size={28} className="text-caramel" />
              </div>
              <p className="display-title text-4xl text-cream">
                {tab === "upcoming"
                  ? "No hay eventos próximos"
                  : tab === "mine"
                    ? "No has creado eventos"
                    : "No hay eventos pasados"}
              </p>
              <p className="mx-auto mt-2 max-w-sm font-secondary text-sm text-wool/58">
                {tab === "upcoming"
                  ? "Creá el primer evento y reuní a la comunidad."
                  : "Creá un evento para compartir con el club."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <article className="brand-panel overflow-hidden transition hover:-translate-y-0.5">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="display-title text-3xl text-cream">
                            {event.title}
                          </h3>
                          <p className="mt-1 font-secondary text-sm text-wool/58">
                            {formatDate(event.event_date)} ·{" "}
                            {formatTime(event.event_date)}
                          </p>
                        </div>
                        <ChevronRight
                          size={18}
                          className="mt-2 shrink-0 text-wool/30"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        {event.location_name && (
                          <span className="flex items-center gap-1.5 font-secondary text-xs text-wool/58">
                            <MapPin size={13} className="text-caramel" />
                            {event.location_name}
                          </span>
                        )}
                        {event.distance_target && (
                          <span className="flex items-center gap-1.5 font-secondary text-xs text-wool/58">
                            <Target size={13} className="text-caramel" />
                            {formatDistance(event.distance_target)}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 font-secondary text-xs text-wool/58">
                          <Users size={13} className="text-caramel" />
                          {event.participant_count}{" "}
                          {event.participant_count === 1
                            ? "asistente"
                            : "asistentes"}
                        </span>
                      </div>

                      {event.clubs && (
                        <p className="mt-2 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-caramel/70">
                          {event.clubs.name}
                        </p>
                      )}

                      {event.my_status && (
                        <div className="mt-2">
                          <span
                            className={`inline-block border px-2 py-0.5 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] ${
                              event.my_status === "going"
                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                : event.my_status === "maybe"
                                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                                  : "border-wool/20 bg-wool/5 text-wool/50"
                            }`}
                          >
                            {event.my_status === "going"
                              ? "Asistiendo"
                              : event.my_status === "maybe"
                                ? "Tal vez"
                                : "No voy"}
                          </span>
                        </div>
                      )}
                    </div>
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
