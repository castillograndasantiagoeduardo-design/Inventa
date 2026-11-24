/**
 * KpiCard.tsx — Tarjeta métrica ejecutiva en cristal (.vidrio) con el estilo de Admin de Sucursal.
 */

import React from 'react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia, type VarianteInsignia } from '@/components/Insignia';
import { Skeleton } from '@/components/ui/Skeleton';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  destacado?: boolean;
  badgeTexto?: string;
  badgeVariante?: VarianteInsignia;
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  loading,
  destacado,
  badgeTexto,
  badgeVariante = 'brand',
}: KpiCardProps) {
  return (
    <Tarjeta className={`h-full ${destacado ? 'ring-1 ring-brand-500/35' : ''}`}>
      <div className="flex flex-col h-full">
        <div className="h-10 flex items-start justify-between gap-3 shrink-0">
          <p className="text-sm font-sans font-medium text-text-muted leading-snug line-clamp-2">
            {label}
          </p>
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-brand-100 border border-brand-200 text-brand-700 dark:bg-brand-500/15 dark:border-brand-400/20 dark:text-brand-300 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-2.5 mb-1 shrink-0">
          {loading ? (
            <Skeleton className="h-9 w-2/3" />
          ) : (
            <p className="text-3xl font-titulos font-semibold tracking-[-0.005em] text-text tabular-nums leading-none">
              {value}
            </p>
          )}
        </div>

        <div className="mt-auto pt-2 min-h-[30px] flex flex-wrap items-center gap-2">
          {!loading && badgeTexto && (
            <Insignia variante={badgeVariante} conPunto tamano="sm" className="tabular-nums shrink-0">
              {badgeTexto}
            </Insignia>
          )}
          {!loading && hint && (
            <span className="text-xs font-sans font-medium text-text-muted leading-tight">
              {hint}
            </span>
          )}
        </div>
      </div>
    </Tarjeta>
  );
}
