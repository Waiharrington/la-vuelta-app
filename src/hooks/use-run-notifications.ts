"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseRunNotificationsOptions {
  isTracking: boolean;
  isPaused: boolean;
  distance: number;
  elapsedTime: number;
  avgPace: number;
  onPause?: () => void;
  onResume?: () => void;
}

export function useRunNotifications({
  isTracking,
  isPaused,
  distance,
  elapsedTime,
  avgPace,
  onPause,
  onResume,
}: UseRunNotificationsOptions) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Screen Wake Lock
  useEffect(() => {
    if (!isTracking) {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
      return;
    }

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {}
    };

    requestWakeLock();

    // Re-acquire on visibility change (required by some browsers)
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isTracking && !wakeLockRef.current) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [isTracking]);

  // Media Session API — shows stats in notification shade
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!isTracking) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      return;
    }

    const formatTime = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
        : `${m}:${String(sec).padStart(2, "0")}`;
    };

    const formatDist = (meters: number) => {
      return (meters / 1000).toFixed(2);
    };

    const formatPaceStr = (p: number) => {
      if (p <= 0) return "--:--";
      const min = Math.floor(p / 60);
      const sec = Math.floor(p % 60);
      return `${min}:${String(sec).padStart(2, "0")}`;
    };

    const status = isPaused ? "PAUSADO" : "CORRIENDO";
    navigator.mediaSession.playbackState = isPaused ? "paused" : "playing";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${status} — ${formatDist(distance)} km`,
      artist: `${formatTime(elapsedTime)} · ${formatPaceStr(avgPace)} /km`,
      album: "La Vuelta Running Club",
      artwork: [
        {
          src: "/brand/logo-round.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });

    if (onPause) {
      navigator.mediaSession.setActionHandler("pause", onPause);
    }
    if (onResume) {
      navigator.mediaSession.setActionHandler("play", onResume);
    }

    // Keep the notification alive by periodically updating
    const interval = setInterval(() => {
      navigator.mediaSession.playbackState = isPaused ? "paused" : "playing";
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${status} — ${formatDist(distance)} km`,
        artist: `${formatTime(elapsedTime)} · ${formatPaceStr(avgPace)} /km`,
        album: "La Vuelta Running Club",
        artwork: [
          {
            src: "/brand/logo-round.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      });
    }, 10000);

    return () => {
      clearInterval(interval);
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, [isTracking, isPaused, distance, elapsedTime, avgPace, onPause, onResume]);
}

