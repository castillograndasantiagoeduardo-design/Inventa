'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatearVariacion } from '../../lib/date-range.utils';

interface KpiReportCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variacionAbsoluta?: number;
  variacionPorcentual?: number | null;
  explicacionContexto?: string;
  inverso?: boolean; // Para métricas donde un aumento es negativo (ej. anuladas o devoluciones)
  className?: string;
}

export function KpiReportCard({
  title,
  value,
  icon,
  variacionAbsoluta = 0,
  variacionPorcentual,
  explicacionContexto,
  inverso = false,
  className = '',
}: KpiReportCardProps) {
  const variacion = formatearVariacion(variacionAbsoluta, variacionPorcentual ?? null, inverso);

  const getBadgeStyle = () => {
    if (variacion.variante === 'success') {
      return 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
    }
    if (variacion.variante === 'danger') {
      return 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/25';
    }
    return 'bg-slate-500/12 text-slate-500 dark:text-slate-400 border-slate-500/25';
  };

  return (
    <div
      className={`vidrio rounded-2xl p-4 flex flex-col justify-between min-h-[148px] border border-border shadow-xs transition-all hover:border-brand-500/40 ${className}`}
    >
      {/* Cabecera: Título e Ícono */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-muted font-sans">
          {title}
        </span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
          {icon}
        </div>
      </div>

      {/* Valor principal */}
      <div className="my-2">
        <h3 className="text-2xl lg:text-[26px] font-bold tracking-tight text-text font-mono tabular-nums leading-tight">
          {value}
        </h3>
      </div>

      {/* Pie con Micro-badge de tendencia y contexto */}
      <div className="mt-1 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
        {variacionPorcentual !== undefined && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium border ${getBadgeStyle()}`}
            title={`Variación absoluta: ${variacionAbsoluta >= 0 ? '+' : ''}${variacionAbsoluta}`}
          >
            {variacion.icono === 'up' && <TrendingUp className="w-3 h-3 shrink-0" />}
            {variacion.icono === 'down' && <TrendingDown className="w-3 h-3 shrink-0" />}
            {variacion.icono === 'equal' && <Minus className="w-3 h-3 shrink-0" />}
            <span>{variacion.texto}</span>
          </div>
        )}
        {explicacionContexto && (
          <span className="text-[11px] text-text-muted font-sans truncate" title={explicacionContexto}>
            {explicacionContexto}
          </span>
        )}
      </div>
    </div>
  );
}
