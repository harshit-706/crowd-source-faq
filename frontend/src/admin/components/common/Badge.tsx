import React from 'react';

type BadgeVariant = 'approved' | 'pending' | 'rejected' | 'admin' | 'user' | 'moderator' | 'default';

interface BadgeVariantStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const VARIANTS: Record<BadgeVariant, BadgeVariantStyle> = {
  approved:  { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
  pending:   { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)',  dot: '#f59e0b' },
  rejected:  { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)',   dot: '#ef4444' },
  admin:     { bg: 'rgba(139,92,246,0.12)',   text: '#a78bfa', border: 'rgba(139,92,246,0.25)',  dot: '#8b5cf6' },
  user:      { bg: 'rgba(59,130,246,0.12)',   text: '#60a5fa', border: 'rgba(59,130,246,0.25)',  dot: '#3b82f6' },
  moderator: { bg: 'rgba(34,211,238,0.12)',   text: '#67e8f9', border: 'rgba(34,211,238,0.25)',  dot: '#22d3ee' },
  default:   { bg: 'rgba(255,255,255,0.06)',  text: '#9ca3af', border: 'rgba(255,255,255,0.1)',  dot: '#6b7280' },
};

interface BadgeProps {
  status?: BadgeVariant;
  label?: string;
  showDot?: boolean;
}

export default function Badge({ status = 'default', label, showDot = true }: BadgeProps) {
  const v = VARIANTS[status] || VARIANTS.default;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border"
      style={{ background: v.bg, color: v.text, borderColor: v.border }}
    >
      {showDot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: v.dot }} />}
      {label || status}
    </span>
  );
}