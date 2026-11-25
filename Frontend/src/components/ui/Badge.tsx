/**
 * Badge.tsx — Etiqueta píldora para estados (activo, inactivo, alerta…).
 */

import React from 'react';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'gold';

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-400/30',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-400/30',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-400/30',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-400/30',
  neutral: 'bg-slate-900/6 dark:bg-white/10 text-text-muted border-border',
  gold: 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border-brand-500/40',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-sans ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
