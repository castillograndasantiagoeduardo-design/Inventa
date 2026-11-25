'use client';

/**
 * BarList.tsx — Barras horizontales con etiqueta y valor directos (ranking, comparativos).
 *
 * Cada fila es enfocable y muestra el detalle secundario en hover/foco, y el valor
 * principal siempre está impreso: el tooltip nunca es la única forma de leer el dato.
 */

import React from 'react';

export interface BarListItem {
  key: string | number;
  label: string;
  value: number;
  /** Texto del valor ya formateado (ej. "$ 1.200.000"). */
  display: string;
  /** Detalle secundario (ej. "34 facturas · ticket $ 35.000"). */
  detail?: string;
  href?: string;
}

interface BarListProps {
  items: BarListItem[];
  color?: string;
  ariaLabel: string;
  renderLink?: (item: BarListItem, children: React.ReactNode) => React.ReactNode;
}

export function BarList({ items, color = 'var(--p-500, #3b6cf2)', ariaLabel, renderLink }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-2">
      {items.map((item) => {
        const pct = Math.max(2, (Math.max(item.value, 0) / max) * 100);
        const fila = (
          <div className="group min-h-[44px] rounded-xl px-2.5 py-2 hover:bg-slate-900/4 dark:hover:bg-white/[0.04] focus-within:bg-slate-900/4 dark:focus-within:bg-white/[0.04] transition-colors">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-text font-medium">{item.label}</span>
              <strong className="shrink-0 text-text tabular-nums">{item.display}</strong>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-slate-900/8 dark:bg-white/[0.08]">
              <div className="h-2 rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            {item.detail && <p className="mt-1 text-[11px] text-text-muted">{item.detail}</p>}
          </div>
        );
        return <li key={item.key}>{renderLink ? renderLink(item, fila) : fila}</li>;
      })}
    </ul>
  );
}
