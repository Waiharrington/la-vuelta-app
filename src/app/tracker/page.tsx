"use client";

import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, formatDuration, formatPace } from "@/lib/utils";
import { Activity, ChevronDown, ChevronUp, Clock, Flame, Lock, MapPin, Pause, Play, Square, Timer, Unlock, Zap } from "lucide-react";
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
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'ready' | 'error'>('ready');
  const [activityType, setActivityType] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('lastActivityType') || 'run';
    return 'run';
  });
  const [screenLocked, setScreenLocked] = useState(false);
  const [shareToFeed, setShareToFeed] = useState(true);
  const [saveAsRoute, setSaveAsRoute] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
  const paceHistoryRef = useRef<number[]>([]);
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

  const checkGpsAndStart = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }
    setGpsStatus('checking');
    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsStatus('ready');
        startTracking();
      },
      (err) => {
        setGpsStatus('error');
        console.error("GPS check failed:", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
                if (newKm % 10 === 0) {
                  vibrate([100, 50, 100, 50, 100, 50, 400]); // 10km
                } else if (newKm % 5 === 0) {
                  vibrate([200, 100, 200, 100, 400]); // 5km
                } else {
                  vibrate([200, 100, 200]); // 1km
                }
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

          // Track pace history for trend indicator (last 30 seconds)
          if (lastPositionRef.current) {
            const timeDiff = (now - lastPositionRef.current.timestamp) / 1000;
            if (timeDiff > 0 && timeDiff < 5) {
              const distM = calculateDistance(
                lastPositionRef.current.lat,
                lastPositionRef.current.lng,
                newPos.lat,
                newPos.lng
              );
              if (distM > 2) {
                const instantPace = timeDiff / (distM / 1000); // seconds per km
                paceHistoryRef.current.push(instantPace);
                // Keep only last 30 seconds of data (roughly 6 samples at 5s intervals)
                if (paceHistoryRef.current.length > 6) {
                  paceHistoryRef.current.shift();
                }
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

    // Save last activity type
    localStorage.setItem('lastActivityType', activityType);

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
    paceHistoryRef.current = [];
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
    vibrate([300]);
  };

  const discardActivity = () => {
    if (confirm("¿Estás seguro de que quieres descartar esta carrera?")) {
      setPositions([]);
      setDistance(0);
      setElapsedTime(0);
      setNotes("");
      setSplits([]);
      setShareToFeed(true);
      setSaveAsRoute(false);
      setSaveSuccess(false);
      LiveActivity.stopActivity().catch(() => {});
      setTrackingState('idle');
    }
  };

  const saveActivity = async () => {
    if (!user) return;

    setSaving(true);
    const avgPace = distance > 0 ? elapsedTime / (distance / 1000) : 0;
    const calories = Math.round(distance * 0.075);
    const distKm = (distance / 1000).toFixed(2);

    // 1. Save activity
    const { data: activityData, error } = await supabase.from("activities").insert({
      user_id: user.id,
      type: "run",
      distance,
      duration: elapsedTime,
      avg_pace: avgPace,
      calories,
      notes: notes || null,
      route_coordinates: positions,
    }).select().single();

    if (error) {
      console.error("Failed to save activity:", error);
      alert(`Error al guardar la carrera: ${error.message || "Error desconocido"}`);
      setSaving(false);
      return;
    }

    // 2. Auto-post to feed if enabled
    if (shareToFeed && activityData) {
      const paceStr = avgPace > 0 ? formatPace(1000 / avgPace) : "0:00";
      const postContent = `Corrí ${distKm}km en ${formatDuration(elapsedTime)} ⏱️ Ritmo: ${paceStr}/km #LaVuelta`;
      const { error: postError } = await supabase.from("posts").insert({
        user_id: user.id,
        activity_id: activityData.id,
        content: postContent,
      });
      if (postError) console.error("Failed to create post:", postError);
    }

    // 3. Save as route if enabled
    if (saveAsRoute) {
      const today = new Date();
      const dateStr = today.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
      const { error: routeError } = await supabase.from("saved_routes").insert({
        user_id: user.id,
        name: `Ruta del ${dateStr}`,
        distance,
        route_coordinates: positions,
      });
      if (routeError) console.error("Failed to save route:", routeError);
    }

    // Show success animation briefly
    setSaveSuccess(true);

    // Clean up after brief success display
    setTimeout(() => {
      setPositions([]);
      setDistance(0);
      setElapsedTime(0);
      setNotes("");
      setSplits([]);
      LiveActivity.stopActivity().catch(() => {});
      setTrackingState('idle');
      setSaveSuccess(false);
      window.location.href = "/feed";
    }, 2000);

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
  const calories = Math.round(distance / 1000 * 75);

  // Pace trend calculation
  const paceHistory = paceHistoryRef.current;
  const avgRecentPace = paceHistory.length > 1
    ? paceHistory.reduce((a, b) => a + b, 0) / paceHistory.length
    : 0;
  const currentPace = avgPace > 0 ? 60 / (1000 / avgPace) : 0; // pace in min/km
  const paceTrend = avgRecentPace > 0 && currentPace > 0
    ? currentPace < avgRecentPace ? 'faster' : currentPace > avgRecentPace ? 'slower' : 'neutral'
    : 'neutral';

  return (
    <div className="min-h-screen bg-dark">
      <Navigation />

      <main className="flex h-screen flex-col pb-[72px] pt-16">
        <div className="relative flex-1 overflow-hidden">
          <div className={screenLocked ? 'pointer-events-none h-full' : 'h-full'}>
            <MapView positions={positions} />
          </div>
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
              {isTracking ? (
                <div className="grid grid-cols-4 gap-2">
                  <div className="metric-card col-span-2 p-3 sm:p-4">
                    <MapPin size={14} className="mb-1 text-caramel" />
                    <p className="display-title text-4xl text-cream sm:text-5xl">
                      {formatDistance(distance)}
                    </p>
                    <p className="font-secondary text-[8px] uppercase tracking-[0.15em] text-wool/42">
                      Distancia
                    </p>
                  </div>
                  <div className="metric-card col-span-1 p-2.5 sm:p-3">
                    <Clock size={13} className="mb-1 text-caramel" />
                    <p className="display-title text-2xl text-cream sm:text-3xl">
                      {formatDuration(elapsedTime)}
                    </p>
                    <p className="font-secondary text-[8px] uppercase tracking-[0.15em] text-wool/42">
                      Tiempo
                    </p>
                  </div>
                  <div className="metric-card col-span-1 p-2.5 sm:p-3">
                    <Zap size={13} className="mb-1 text-caramel" />
                    <p className={`display-title text-2xl sm:text-3xl ${
                      paceTrend === 'faster' ? 'text-green-400' : paceTrend === 'slower' ? 'text-red-400' : 'text-caramel'
                    }`}>
                      {avgPace > 0 ? formatPace(1000 / avgPace) : "0:00"}
                      {paceTrend === 'faster' && <ChevronUp size={14} className="inline ml-0.5" />}
                      {paceTrend === 'slower' && <ChevronDown size={14} className="inline ml-0.5" />}
                    </p>
                    <p className="font-secondary text-[8px] uppercase tracking-[0.15em] text-wool/42">
                      Ritmo/km
                    </p>
                  </div>
                </div>
              ) : (
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
              )}

              {/* Secondary stats (visible during tracking) */}
              {isTracking && (
                <div className="mt-2 grid grid-cols-4 gap-2 border-t border-wool/10 pt-2">
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
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame size={12} className="text-orange-400" />
                      <p className="font-secondary text-lg font-bold text-orange-400">
                        {calories}
                      </p>
                    </div>
                    <p className="font-secondary text-[8px] uppercase tracking-[0.12em] text-wool/38">
                      Calorías
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
            <div className="space-y-3">
              {/* Activity type selector */}
              <div className="flex gap-2">
                {[
                  { value: 'run', label: 'Correr', icon: '🏃' },
                  { value: 'walk', label: 'Caminar', icon: '🚶' },
                  { value: 'hike', label: 'Senderismo', icon: '🥾' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setActivityType(type.value)}
                    className={`flex-1 py-2 px-3 font-secondary text-xs transition-colors ${
                      activityType === type.value
                        ? 'border border-caramel/60 bg-wine/40 text-caramel'
                        : 'border border-wool/12 bg-dark/30 text-wool/58 hover:border-wool/25'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>

              {/* GPS Status Indicator */}
              {gpsStatus === 'checking' && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="font-secondary text-xs text-amber-400">Buscando señal GPS...</p>
                </div>
              )}
              {gpsStatus === 'error' && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <p className="font-secondary text-xs text-red-400">Error de GPS</p>
                  <button
                    onClick={checkGpsAndStart}
                    className="font-secondary text-xs text-caramel underline"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              <button
                onClick={checkGpsAndStart}
                disabled={gpsStatus === 'checking'}
                className="brand-button w-full py-4 disabled:opacity-50"
              >
                <Play size={20} fill="currentColor" />
                {gpsStatus === 'checking' ? 'Buscando GPS...' : 'Iniciar carrera'}
              </button>
            </div>
          )}

          {(trackingState === 'tracking' || trackingState === 'paused') && (
            <div className="space-y-3">
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
                  onClick={() => {
                    vibrate([300]);
                    stopTracking();
                  }}
                  className="brand-button flex-1 py-3"
                >
                  <Square size={16} /> Detener
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setScreenLocked(!screenLocked);
                    vibrate(50);
                  }}
                  className={`ghost-button px-4 py-2 text-xs ${
                    screenLocked ? 'border-caramel/40 text-caramel' : 'text-wool/50'
                  }`}
                >
                  {screenLocked ? <Unlock size={14} /> : <Lock size={14} />}
                  <span className="ml-1">{screenLocked ? 'Desbloquear' : 'Bloquear pantalla'}</span>
                </button>
              </div>
            </div>
          )}

          {trackingState === 'summary' && (
            <div className="space-y-3">
              {saveSuccess ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-caramel/20">
                    <svg className="h-8 w-8 text-caramel animate-success-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="display-title text-xl text-cream">¡Carrera guardada!</p>
                  <p className="font-secondary text-sm text-wool/50 mt-1">Tu actividad fue registrada</p>
                  <button
                    onClick={() => {
                      const shareText = `Corrí ${(distance / 1000).toFixed(2)}km en ${formatDuration(elapsedTime)} ⏱️ Ritmo: ${avgPace > 0 ? formatPace(1000 / avgPace) : "0:00"}/km #LaVuelta`;
                      if (navigator.share) {
                        navigator.share({ title: "La Vuelta Running Co.", text: shareText });
                      } else {
                        navigator.clipboard.writeText(shareText);
                        alert("¡Link copiado al portapapeles!");
                      }
                    }}
                    className="ghost-button mt-4 py-2 px-6 text-caramel border-caramel/30"
                  >
                    Compartir
                  </button>
                </div>
              ) : (
                <>
                  {/* Map Preview */}
                  {positions.length > 1 && (
                    <div className="h-40 overflow-hidden border border-wool/10">
                      <MapView positions={positions} />
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="metric-card p-3 text-center">
                      <p className="display-title text-2xl text-cream">{formatDistance(distance)}</p>
                      <p className="font-secondary text-[9px] uppercase text-wool/42">Distancia</p>
                    </div>
                    <div className="metric-card p-3 text-center">
                      <p className="display-title text-2xl text-cream">{formatDuration(elapsedTime)}</p>
                      <p className="font-secondary text-[9px] uppercase text-wool/42">Tiempo</p>
                    </div>
                    <div className="metric-card p-3 text-center">
                      <p className="display-title text-2xl text-caramel">{avgPace > 0 ? formatPace(1000 / avgPace) : "0:00"}</p>
                      <p className="font-secondary text-[9px] uppercase text-wool/42">Ritmo/km</p>
                    </div>
                  </div>

                  {/* Quick Notes Chips */}
                  <div>
                    <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42 mb-2">¿Cómo te sentiste?</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Me sentí genial 💪",
                        "Ritmo perfecto ⚡",
                        "Difícil pero logrado 🔥",
                        "Primera vez aquí 🆕"
                      ].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setNotes(notes === chip ? "" : chip)}
                          className={`border px-3 py-1.5 font-secondary text-xs transition-colors ${
                            notes === chip
                              ? "border-caramel/60 bg-wine/40 text-caramel"
                              : "border-wool/12 bg-dark/30 text-wool/58 hover:border-wool/25"
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Notes Input */}
                  <input
                    type="text"
                    placeholder="Nota personal (opcional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="brand-input text-sm"
                  />

                  {/* Toggles */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-between border border-wool/10 bg-dark/30 px-4 py-3 cursor-pointer">
                      <span className="font-secondary text-sm text-cream">Compartir en el feed</span>
                      <div
                        onClick={() => setShareToFeed(!shareToFeed)}
                        className={`relative h-6 w-11 transition-colors ${shareToFeed ? 'bg-caramel' : 'bg-wool/20'}`}
                      >
                        <div className={`absolute top-0.5 h-5 w-5 bg-cream transition-transform ${shareToFeed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                    <label className="flex items-center justify-between border border-wool/10 bg-dark/30 px-4 py-3 cursor-pointer">
                      <span className="font-secondary text-sm text-cream">Guardar como ruta</span>
                      <div
                        onClick={() => setSaveAsRoute(!saveAsRoute)}
                        className={`relative h-6 w-11 transition-colors ${saveAsRoute ? 'bg-caramel' : 'bg-wool/20'}`}
                      >
                        <div className={`absolute top-0.5 h-5 w-5 bg-cream transition-transform ${saveAsRoute ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button onClick={discardActivity} className="ghost-button flex-1 py-3 text-wool/60 hover:text-wool border-wool/20">
                      Descartar
                    </button>
                    <button
                      onClick={saveActivity}
                      disabled={saving}
                      className="brand-button flex-[2] py-3 disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                          Guardando...
                        </span>
                      ) : (
                        "Guardar carrera"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
