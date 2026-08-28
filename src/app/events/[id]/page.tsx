"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Target,
  Users,
  Edit,
  ArrowLeft,
  Check,
  X,
  HelpCircle,
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
}

interface Participant {
  user_id: string;
  status: "going" | "maybe" | "not_going";
  joined_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myStatus, setMyStatus] = useState<
    "going" | "maybe" | "not_going" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

  const fetchEvent = useCallback(async () => {
    const { data: eventData } = await supabase
      .from("events")
      .select("*, clubs(name)")
      .eq("id", id)
      .single();

    if (!eventData) {
      setLoading(false);
      return;
    }

    setEvent(eventData as Event);

    // Fetch participants with profiles
    const { data: participantsData } = await supabase
      .from("event_participants")
      .select("*, profiles(full_name, username, avatar_url)")
      .eq("event_id", id);

    if (participantsData) {
      setParticipants(participantsData as Participant[]);

      const myRsvp = participantsData.find((p) => p.user_id === user?.id);
      if (myRsvp) setMyStatus(myRsvp.status);
    }

    setLoading(false);
  }, [id, user, supabase]);

  useEffect(() => {
    if (!authLoading) {
      fetchEvent();
    }
  }, [fetchEvent, authLoading]);

  const handleRSVP = async (status: "going" | "maybe" | "not_going") => {
    if (!user || updating) return;

    const prevStatus = myStatus;
    setUpdating(true);

    // Optimistic update
    setMyStatus(status);

    if (prevStatus) {
      // Update existing RSVP
      const { error } = await supabase
        .from("event_participants")
        .update({ status })
        .eq("event_id", id)
        .eq("user_id", user.id);

      if (error) {
        setMyStatus(prevStatus);
        setUpdating(false);
        return;
      }
    } else {
      // Insert new RSVP
      const { error } = await supabase
        .from("event_participants")
        .insert({
          event_id: id,
          user_id: user.id,
          status,
        });

      if (error) {
        setMyStatus(null);
        setUpdating(false);
        return;
      }
    }

    // Refresh participants
    const { data: participantsData } = await supabase
      .from("event_participants")
      .select("*, profiles(full_name, username, avatar_url)")
      .eq("event_id", id);

    if (participantsData) {
      setParticipants(participantsData as Participant[]);
    }

    setUpdating(false);
  };

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
            <Skeleton className="h-10 w-24 mb-5" />
            <div className="brand-panel p-5 sm:p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <button
              onClick={() => router.back()}
              className="mb-5 flex items-center gap-2 font-secondary text-sm text-wool/58 hover:text-cream"
            >
              <ArrowLeft size={16} />
              Volver
            </button>
            <div className="brand-panel px-5 py-16 text-center">
              <p className="display-title text-4xl text-cream">
                Evento no encontrado
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const going = participants.filter((p) => p.status === "going");
  const maybe = participants.filter((p) => p.status === "maybe");
  const notGoing = participants.filter((p) => p.status === "not_going");

  const hasMap =
    event.location_lat !== null && event.location_lng !== null;

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-5 flex items-center gap-2 font-secondary text-sm text-wool/58 hover:text-cream"
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          {/* Event Header */}
          <section className="brand-panel mb-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-kicker mb-2">Detalle del evento</p>
                <h1 className="display-title text-5xl text-cream sm:text-7xl">
                  {event.title}
                </h1>
              </div>
              {event.created_by === user?.id && (
                <Link
                  href={`/events/${event.id}/edit`}
                  className="brand-button flex items-center gap-2 px-4 py-2 text-xs"
                >
                  <Edit size={14} />
                  Editar
                </Link>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-caramel" />
                <span className="font-secondary text-sm text-cream">
                  {formatDate(event.event_date)} · {formatTime(event.event_date)}
                </span>
              </div>
              {event.location_name && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-caramel" />
                  <span className="font-secondary text-sm text-cream">
                    {event.location_name}
                  </span>
                </div>
              )}
              {event.distance_target && (
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-caramel" />
                  <span className="font-secondary text-sm text-cream">
                    {formatDistance(event.distance_target)}
                  </span>
                </div>
              )}
              {event.clubs && (
                <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-caramel/70">
                  {event.clubs.name}
                </p>
              )}
            </div>

            {event.description && (
              <p className="mt-4 border-l-2 border-caramel/55 pl-3 font-secondary text-sm leading-6 text-wool/72">
                {event.description}
              </p>
            )}
          </section>

          {/* Map Preview */}
          {hasMap && (
            <section className="brand-panel mb-5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-caramel" />
                <p className="section-kicker">Ubicación</p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${event.location_lat},${event.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden border border-wool/10 transition hover:opacity-90"
              >
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${event.location_lat},${event.location_lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${event.location_lat},${event.location_lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}`}
                  alt="Mapa del evento"
                  className="h-48 w-full object-cover"
                />
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${event.location_lat},${event.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-center font-secondary text-xs text-caramel hover:underline"
              >
                Cómo llegar
              </a>
            </section>
          )}

          {/* RSVP Section */}
          <section className="brand-panel mb-5 p-5 sm:p-6">
            <p className="section-kicker mb-4">Confirmar asistencia</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleRSVP("going")}
                disabled={updating}
                className={`flex flex-col items-center gap-2 border p-4 transition-colors ${
                  myStatus === "going"
                    ? "border-green-500/40 bg-green-500/15 text-green-400"
                    : "border-wool/15 bg-dark/30 text-wool/58 hover:border-green-500/30 hover:text-green-400"
                }`}
              >
                <Check size={24} />
                <span className="font-secondary text-xs font-bold uppercase tracking-[0.16em]">
                  Asistir
                </span>
              </button>
              <button
                onClick={() => handleRSVP("maybe")}
                disabled={updating}
                className={`flex flex-col items-center gap-2 border p-4 transition-colors ${
                  myStatus === "maybe"
                    ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-400"
                    : "border-wool/15 bg-dark/30 text-wool/58 hover:border-yellow-500/30 hover:text-yellow-400"
                }`}
              >
                <HelpCircle size={24} />
                <span className="font-secondary text-xs font-bold uppercase tracking-[0.16em]">
                  Tal vez
                </span>
              </button>
              <button
                onClick={() => handleRSVP("not_going")}
                disabled={updating}
                className={`flex flex-col items-center gap-2 border p-4 transition-colors ${
                  myStatus === "not_going"
                    ? "border-wool/40 bg-wool/15 text-wool"
                    : "border-wool/15 bg-dark/30 text-wool/58 hover:border-wool/30 hover:text-wool"
                }`}
              >
                <X size={24} />
                <span className="font-secondary text-xs font-bold uppercase tracking-[0.16em]">
                  No puedo
                </span>
              </button>
            </div>
          </section>

          {/* Attendees */}
          <section className="brand-panel p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-caramel" />
              <p className="section-kicker">
                Asistentes ({participants.length})
              </p>
            </div>

            {participants.length === 0 ? (
              <p className="py-4 text-center font-secondary text-sm text-wool/42">
                Aún no hay confirmaciones. Sé el primero en asistir.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Going */}
                {going.length > 0 && (
                  <div>
                    <p className="mb-2 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-green-400">
                      Asistiendo ({going.length})
                    </p>
                    <div className="space-y-2">
                      {going.map((p) => (
                        <AttendeeRow key={p.user_id} participant={p} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Maybe */}
                {maybe.length > 0 && (
                  <div>
                    <p className="mb-2 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-400">
                      Tal vez ({maybe.length})
                    </p>
                    <div className="space-y-2">
                      {maybe.map((p) => (
                        <AttendeeRow key={p.user_id} participant={p} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Going */}
                {notGoing.length > 0 && (
                  <div>
                    <p className="mb-2 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                      No van ({notGoing.length})
                    </p>
                    <div className="space-y-2">
                      {notGoing.map((p) => (
                        <AttendeeRow key={p.user_id} participant={p} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function AttendeeRow({ participant }: { participant: Participant }) {
  return (
    <Link href={`/users/${participant.user_id}`}>
      <div className="flex items-center gap-3 border-b border-wool/8 py-2 last:border-0 transition hover:bg-wool/5 -mx-2 px-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
          <span className="font-display text-sm text-cream">
            {participant.profiles?.full_name?.charAt(0) || "U"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-secondary text-sm font-bold text-cream">
            {participant.profiles?.full_name || "Runner"}
          </p>
          <p className="font-secondary text-[10px] text-wool/42">
            @{participant.profiles?.username || "runner"}
          </p>
        </div>
      </div>
    </Link>
  );
}
