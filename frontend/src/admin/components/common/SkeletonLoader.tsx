import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function Skeleton({ className = '', style = {} }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s infinite linear',
        ...style,
      }}
    />
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl p-5 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="w-12 h-4" />
      </div>
      <Skeleton className="w-20 h-7 mb-2" />
      <Skeleton className="w-32 h-3" />
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-5 rounded-md" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-16 h-7 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

interface ChartSkeletonProps {
  height?: number;
}

export function ChartSkeleton({ height = 220 }: ChartSkeletonProps) {
  return (
    <Skeleton className="w-full rounded-xl" style={{ height }} />
  );
}

export default Skeleton;