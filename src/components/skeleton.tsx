"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-wool/8 via-wool/15 to-wool/8",
        className
      )}
    />
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className="activity-card brand-panel overflow-hidden p-4">
      <div className="flex items-start gap-3 border-b border-wool/10 pb-4 mb-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="metric-card p-3 space-y-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-2 w-12" />
        </div>
        <div className="metric-card p-3 space-y-2">
          <Skeleton className="h-4 w-4 mx-auto" />
          <Skeleton className="h-7 w-14 mx-auto" />
          <Skeleton className="h-2 w-12 mx-auto" />
        </div>
        <div className="metric-card p-3 space-y-2 text-right">
          <Skeleton className="h-4 w-4 ml-auto" />
          <Skeleton className="h-7 w-14 ml-auto" />
          <Skeleton className="h-2 w-12 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="metric-card p-4 space-y-2">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="brand-panel overflow-hidden">
      <Skeleton className="h-28 w-full" />
      <div className="px-5 pb-6">
        <div className="-mt-12 mb-4 flex items-end justify-between">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <ActivityCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TrackerOverlaySkeleton() {
  return (
    <div className="brand-panel p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="metric-card p-2.5 space-y-1">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-2 w-12" />
        </div>
        <div className="metric-card p-2.5 space-y-1">
          <Skeleton className="h-3 w-3 mx-auto" />
          <Skeleton className="h-6 w-14 mx-auto" />
          <Skeleton className="h-2 w-12 mx-auto" />
        </div>
        <div className="metric-card p-2.5 space-y-1">
          <Skeleton className="h-3 w-3 ml-auto" />
          <Skeleton className="h-6 w-14 ml-auto" />
          <Skeleton className="h-2 w-12 ml-auto" />
        </div>
      </div>
    </div>
  );
}
