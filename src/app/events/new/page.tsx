"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/skeleton";

interface Club {
  id: string;
  name: string;
}

export default function NewEventPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [distanceTarget, setDistanceTarget] = useState("");
  const [clubId, setClubId] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchClubs = async () => {
      const { data } = await supabase
        .from("club_members")
        .select("clubs(id, name)")
        .eq("user_id", user.id);

      if (data) {
        setClubs(data.map((cm: { clubs: { id: string; name: string }[] }) => cm.clubs?.[0]).filter(Boolean) as Club[]);
      }
    };

    fetchClubs();
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);

    const eventDateTime = new Date(`${eventDate}T${eventTime}`);

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDateTime.toISOString(),
        location_name: locationName.trim() || null,
        location_lat: locationLat ? parseFloat(locationLat) : null,
        location_lng: locationLng ? parseFloat(locationLng) : null,
        distance_target: distanceTarget ? parseFloat(distanceTarget) : null,
        club_id: clubId || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (!error && data) {
      router.push(`/events/${data.id}`);
    }

    setSaving(false);
  };

  if (authLoading) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <Skeleton className="h-10 w-24 mb-5" />
            <div className="brand-panel p-5 sm:p-6">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
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
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-5 flex items-center gap-2 font-secondary text-sm text-wool/58 hover:text-cream"
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          {/* Form Header */}
          <section className="brand-panel mb-5 p-5 sm:p-6">
            <p className="section-kicker mb-2">Nuevo evento</p>
            <h1 className="display-title text-5xl text-cream sm:text-7xl">
              Crear evento.
            </h1>
          </section>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="brand-panel p-5">
              <label className="mb-2 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Título del evento *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Salida grupal al Bosques"
                required
                maxLength={100}
                className="brand-input w-full"
              />
            </div>

            {/* Description */}
            <div className="brand-panel p-5">
              <label className="mb-2 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles del evento, qué llevar, punto de encuentro..."
                rows={4}
                maxLength={500}
                className="brand-input resize-none w-full"
              />
              <p className="mt-1 font-secondary text-[10px] text-wool/32">
                {description.length}/500
              </p>
            </div>

            {/* Date & Time */}
            <div className="brand-panel p-5">
              <label className="mb-2 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Fecha y hora *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="brand-input w-full"
                  aria-label="Fecha del evento"
                />
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  required
                  className="brand-input w-full"
                  aria-label="Hora del evento"
                />
              </div>
            </div>

            {/* Location */}
            <div className="brand-panel p-5">
              <label className="mb-2 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Ubicación
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ej: Parque Centenario, Buenos Aires"
                className="brand-input mb-3 w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={locationLat}
                  onChange={(e) => setLocationLat(e.target.value)}
                  placeholder="Latitud"
                  step="any"
                  className="brand-input w-full"
                  aria-label="Latitud"
                />
                <input
                  type="number"
                  value={locationLng}
                  onChange={(e) => setLocationLng(e.target.value)}
                  placeholder="Longitud"
                  step="any"
                  className="brand-input w-full"
                  aria-label="Longitud"
                />
              </div>
            </div>

            {/* Distance Target */}
            <div className="brand-panel p-5">
              <label className="mb-2 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                Distancia objetivo (metros)
              </label>
              <input
                type="number"
                value={distanceTarget}
                onChange={(e) => setDistanceTarget(e.target.value)}
                placeholder="Ej: 5000"
                min="0"
                step="100"
                className="brand-input w-full"
              />
            </div>

            {/* Club Association */}
            {clubs.length > 0 && (
              <div className="brand-panel p-5">
                <label className="mb-2 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                  Asociar a club (opcional)
                </label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="brand-input w-full"
                >
                  <option value="">Sin asociación</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit */}
            <div className="brand-panel p-5">
              <button
                type="submit"
                disabled={!title.trim() || !eventDate || saving}
                className="brand-button flex w-full items-center justify-center gap-2 py-3"
              >
                <Save size={18} />
                {saving ? "Creando..." : "Crear Evento"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
