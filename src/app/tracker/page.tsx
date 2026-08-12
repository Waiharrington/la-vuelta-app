"use client";

import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDuration, formatPace } from "@/lib/utils";
import { Activity, Clock, MapPin, Pause, Play, Square, Timer, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { useRunNotifications } from "@/hooks/use-run-notifications";
import LiveActivity from "@/lib/native-bridge";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-dark/70">
      <p className="font-secondary text-sm text-wool/45">Cargando mapa...</p>
    </div>
  ),
});

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

interface Split {
  km: number;
  time: number;
  pace: number;
}

const SILENT_AUDIO_SRC = "/silence.mp3";

export default function TrackerPage() {
  const { user } = useAuth();
  const [trackingState, setTrackingState] = useState<'idle' | 'tracking' | 'paused' | 'summary'>('idle');
  const [positions, setPositions] = useState<Position[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [splits, setSplits] = useState<Split[]>([]);
  const [cadence, setCadence] = useState(0);

  const isTracking = trackingState === 'tracking' || trackingState === 'paused';
  const isPaused = trackingState === 'paused';

  const watchRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const totalPausedRef = useRef(0);
  const lastPositionRef = useRef<Position | null>(null);
  const lastKmRef = useRef(0);
  const splitStartRef = useRef<number>(0);
  const cadenceBufferRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  // Setup audioSession category on mount if supported
  useEffect(() => {
    if (typeof window !== "undefined" && "audioSession" in navigator) {
      try {
        (navigator as any).audioSession.type = "playback";
      } catch (e) {
        console.error("Failed to set audio session type:", e);
      }
    }
  }, []);

  // PWA notifications (Media Session + Wake Lock)
  useRunNotifications({
    isTracking,
    isPaused,
    distance,
    elapsedTime,
    avgPace: distance > 0 && elapsedTime > 0 ? elapsedTime / (distance / 1000) : 0,
    onPause: () => {
      if (trackingState === 'tracking') {
        pauseTracking();
      }
    },
    onResume: () => {
      if (trackingState === 'paused') {
        pauseTracking();
      }
    }
  });

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const vibrate = (pattern: number | number[]) => {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  };

  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      const now = Date.now();
      const newPos: Position = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: now,
      };

      setPositions((prev) => {
        if (lastPositionRef.current) {
          const dist = calculateDistance(
            lastPositionRef.current.lat,
            lastPositionRef.current.lng,
            newPos.lat,
            newPos.lng
          );
          if (dist > 2) {
            setDistance((d) => {
              const newTotal = d + dist;

              // Check for km milestone
              const prevKm = Math.floor(d / 1000);
              const newKm = Math.floor(newTotal / 1000);
              if (newKm > prevKm && newKm > 0) {
                // Record split
                const splitTime = (now - splitStartRef.current) / 1000;
                const splitPace = splitTime / 1; // seconds per km
                setSplits((prev) => [
                  ...prev,
                  { km: newKm, time: splitTime, pace: splitPace },
                ]);
                splitStartRef.current = now;

                // Haptic feedback: vibration pattern for km milestone
                vibrate([200, 100, 200, 100, 400]);
              }

              return newTotal;
            });
          }

          // Estimate cadence from GPS speed (rough approximation)
          // Average stride length ~0.7-0.8m, use 0.75m
          if (lastPositionRef.current) {
            const timeDiff = (now - lastPositionRef.current.timestamp) / 1000;
            if (timeDiff > 0 && timeDiff < 5) {
              const distM = calculateDistance(
                lastPositionRef.current.lat,
                lastPositionRef.current.lng,
                newPos.lat,
                newPos.lng
              );
              const speedMs = distM / timeDiff;
              // steps per minute = (speed in m/s * 60) / avg_stride_length
              const estimatedStepsPerMin = Math.round((speedMs * 60) / 0.75);
              // Only update if reasonable (100-210 spm range for running)
              if (estimatedStepsPerMin >= 100 && estimatedStepsPerMin <= 210) {
                cadenceBufferRef.current.push(estimatedStepsPerMin);
                if (cadenceBufferRef.current.length > 5) {
                  cadenceBufferRef.current.shift();
                }
                const avg =
                  cadenceBufferRef.current.reduce((a, b) => a + b, 0) /
                  cadenceBufferRef.current.length;
                setCadence(Math.round(avg));
              }
            }
          }
        }
        lastPositionRef.current = newPos;
        return [...prev, newPos];
      });
    },
    []
  );

  const updateElapsed = useCallback(() => {
    const now = Date.now();
    const active = now - startTimeRef.current - totalPausedRef.current;
    setElapsedTime(Math.floor(active / 1000));
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    // iOS Safari requires audio initialization and play to be synchronous with a user interaction event
    if (typeof window !== "undefined") {
      const audio = new Audio(SILENT_AUDIO_SRC);
      audio.loop = true;
      audioRef.current = audio;
      audio.play().catch((err) => {
        console.error("Direct audio play failed on iOS Safari:", err);
      });
    }

    setTrackingState('tracking');
    setPositions([]);
    setDistance(0);
    setElapsedTime(0);
    setSplits([]);
    setCadence(0);
    startTimeRef.current = Date.now();
    pausedAtRef.current = 0;
    totalPausedRef.current = 0;
    lastPositionRef.current = null;
    lastKmRef.current = 0;
    splitStartRef.current = Date.now();
    cadenceBufferRef.current = [];

    watchRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(updateElapsed, 1000);
    LiveActivity.startActivity({
      distance: "0.00 km",
      elapsedTime: "0:00",
      avgPace: "--:-- /km",
    }).catch(() => {});
    vibrate(100);
  };

  const pauseTracking = useCallback(() => {
    setTrackingState((curr) => {
      if (curr === 'paused') {
        totalPausedRef.current += Date.now() - pausedAtRef.current;
        pausedAtRef.current = 0;
        audioRef.current?.play().catch((err) => console.log("Audio play failed:", err));
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(updateElapsed, 1000);
        return 'tracking';
      } else if (curr === 'tracking') {
        pausedAtRef.current = Date.now();
        audioRef.current?.pause();
        if (intervalRef.current) clearInterval(intervalRef.current);
        updateElapsed();
        return 'paused';
      }
      return curr;
    });
  }, [updateElapsed]);

  const stopTracking = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    LiveActivity.stopActivity().catch(() => {});
    setTrackingState('summary');
    vibrate(200);
  };

  const discardActivity = () => {
    if (confirm("¿Estás seguro de que quieres descartar esta carrera?")) {
      setPositions([]);
      setDistance(0);
      setElapsedTime(0);
      setNotes("");
      setSplits([]);
      LiveActivity.stopActivity().catch(() => {});
      setTrackingState('idle');
    }
  };

  const saveActivity = async () => {
    if (!user) return;

    setSaving(true);
    const avgPace = distance > 0 ? elapsedTime / (distance / 1000) : 0;

    const { error } = await supabase.from("activities").insert({
      user_id: user.id,
      type: "run",
      distance,
      duration: elapsedTime,
      avg_pace: avgPace,
      calories: Math.round(distance * 0.075),
      notes: notes || null,
      route_coordinates: positions,
    });

    if (error) {
      console.error("Failed to save activity:", error);
      alert(`Error al guardar la carrera: ${error.message || "Error desconocido"}`);
    } else {
      setPositions([]);
      setDistance(0);
      setElapsedTime(0);
      setNotes("");
      setSplits([]);
      LiveActivity.stopActivity().catch(() => {});
      setTrackingState('idle');
      window.location.href = "/feed";
    }
    setSaving(false);
  };

  // Helper formatting for Live Activity
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`;
  };

  const formatDist = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatPaceStr = (p: number) => {
    if (p <= 0) return "--:--";
    const min = Math.floor(p / 60);
    const sec = Math.floor(p % 60);
    return `${min}:${String(sec).padStart(2, "0")} /km`;
  };

  // Sync tracking stats to native Live Activity
  useEffect(() => {
    if (trackingState === 'tracking' || trackingState === 'paused') {
      const paceVal = distance > 0 && elapsedTime > 0 ? elapsedTime / (distance / 1000) : 0;
      LiveActivity.updateActivity({
        distance: formatDist(distance),
        elapsedTime: formatTime(elapsedTime),
        avgPace: formatPaceStr(paceVal),
      }).catch(() => {});
    }
  }, [distance, elapsedTime, trackingState]);

  useEffect(() => {
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      LiveActivity.stopActivity().catch(() => {});
    };
  }, []);

  const avgPace = distance > 0 && elapsedTime > 0 ? elapsedTime / (distance / 1000) : 0;
  const currentKm = Math.floor(distance / 1000);
  const lastSplit = splits.length > 0 ? splits[splits.length - 1] : null;

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      <main className="flex h-screen flex-col pb-[72px] pt-16">
        <div className="relative flex-1 overflow-hidden">
          <MapView positions={positions} />
          <div className="pointer-events-none absolute inset-0 z-[410] bg-gradient-to-b from-dark/65 via-transparent to-dark/82" />

          {/* Stats overlay */}
          <div className="absolute left-3 right-3 top-3 z-[420]">
            <div className="brand-panel p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="section-kicker text-[10px]">Tracker GPS</p>
                  <h1 className="display-title text-3xl text-cream sm:text-4xl">
                    {isTracking ? (isPaused ? "Pausado" : "En vivo") : "Nueva vuelta"}
                  </h1>
                </div>
                {isTracking && (
                  <div className={`h-2.5 w-2.5 rounded-full ${isPaused ? "bg-yellow-400" : "bg-green-400 pulse-ring"}`} />
                )}
              </div>

              {/* Primary metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="metric-card p-2.5 sm:p-3">
                  <MapPin size={13} className="mb-1 text-caramel" />
                  <p className="display-title text-xl text-cream sm:text-2xl">
                    {formatDistance(distance)}
                  </p>
                  <p className="font-secondary text-[8px] uppercase tracking-[0.15em] text-wool/42">
                    Distancia
                  </p>
                </div>
                <div className="metric-card p-2.5 sm:p-3">
                  <Clock size={13} className="mb-1 text-caramel" />
                  <p className="display-title text-xl text-cream sm:text-2xl">
                    {formatDuration(elapsedTime)}
                  </p>
                  <p className="font-secondary text-[8px] uppercase tracking-[0.15em] text-wool/42">
                    Tiempo
                  </p>
                </div>
                <div className="metric-card p-2.5 sm:p-3">
                  <Zap size={13} className="mb-1 text-caramel" />
                  <p className="display-title text-xl text-caramel sm:text-2xl">
                    {avgPace > 0 ? formatPace(1000 / avgPace) : "0:00"}
                  </p>
                  <p className="font-secondary text-[8px] uppercase tracking-[0.15em] text-wool/42">
                    Ritmo/km
                  </p>
                </div>
              </div>

              {/* Secondary stats (visible during tracking) */}
              {isTracking && (
                <div className="mt-2 grid grid-cols-3 gap-2 border-t border-wool/10 pt-2">
                  <div className="text-center">
                    <p className="font-secondary text-lg font-bold text-cream">
                      {cadence > 0 ? cadence : "--"}
                    </p>
                    <p className="font-secondary text-[8px] uppercase tracking-[0.12em] text-wool/38">
                      Cadencia
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-secondary text-lg font-bold text-cream">
                      {currentKm}
                    </p>
                    <p className="font-secondary text-[8px] uppercase tracking-[0.12em] text-wool/38">
                      Km actual
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-secondary text-lg font-bold text-caramel">
                      {lastSplit ? formatPace(lastSplit.pace) : "--:--"}
                    </p>
                    <p className="font-secondary text-[8px] uppercase tracking-[0.12em] text-wool/38">
                      Último km
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pulse indicator */}
          {isTracking && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[420]">
              <div className="relative">
                <div className="w-3 h-3 bg-wine rounded-full" />
                <div className="absolute inset-0 w-3 h-3 bg-wine rounded-full pulse-ring" />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="border-t border-wool/10 bg-dark/96 p-4">
          {trackingState === 'idle' && (
            <button
              onClick={startTracking}
              className="brand-button w-full py-4"
            >
              <Play size={20} fill="currentColor" />
              Iniciar carrera
            </button>
          )}

          {(trackingState === 'tracking' || trackingState === 'paused') && (
            <div className="flex gap-3">
              <button
                onClick={pauseTracking}
                className="ghost-button flex-1 py-3"
              >
                {isPaused ? (
                  <>
                    <Play size={16} /> Continuar
                  </>
                ) : (
                  <>
                    <Pause size={16} /> Pausar
                  </>
                )}
              </button>
              <button
                onClick={stopTracking}
                className="brand-button flex-1 py-3"
              >
                <Square size={16} /> Detener
              </button>
            </div>
          )}

          {trackingState === 'summary' && (
            <div className="space-y-3">
              <h3 className="font-secondary text-xs font-bold text-cream uppercase tracking-wider">Resumen de tu Vuelta</h3>
              <input
                type="text"
                placeholder="¿Cómo te sentiste? Agrega una nota..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="brand-input"
              />
              <div className="flex gap-3">
                <button
                  onClick={discardActivity}
                  className="ghost-button flex-1 py-3 text-wool/60 hover:text-wool border-wool/20"
                >
                  Descartar
                </button>
                <button
                  onClick={saveActivity}
                  disabled={saving}
                  className="brand-button flex-[2] py-3 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar carrera"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
