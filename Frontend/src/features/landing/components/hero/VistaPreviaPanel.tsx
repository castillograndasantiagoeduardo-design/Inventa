/**
 * VistaPreviaPanel.tsx — Maqueta ilustrativa del panel de Admin de sucursal para el hero.
 *
 * Datos de ejemplo (no consulta la API). Reemplaza al antiguo robot animado.
 */

import React from 'react';
import { LayoutDashboard, TrendingUp } from 'lucide-react';

const KPIS = [
  { etiqueta: 'Ventas del día', valor: '$8.450.000', variacion: '+12,5 % vs. ayer' },
  { etiqueta: 'Facturas emitidas', valor: '156', variacion: '+8 hoy' },
  { etiqueta: 'Ticket promedio', valor: '$54.200', variacion: '+3,1 % semanal' },
];

const VENTAS_SEMANA = [
  { dia: 'L', valor: 58 },
  { dia: 'M', valor: 72 },
  { dia: 'X', valor: 64 },
  { dia: 'J', valor: 88 },
  { dia: 'V', valor: 76 },
  { dia: 'S', valor: 100 },
  { dia: 'D', valor: 92 },
];

const VENTAS_RECIENTES = [
  { consecutivo: 'FAC-2026-0891', cliente: 'Ferretería El Tornillo', total: '$1.240.000' },
  { consecutivo: 'FAC-2026-0890', cliente: 'Constructora Andina S.A.S.', total: '$3.880.500' },
  { consecutivo: 'FAC-2026-0889', cliente: 'Cliente mostrador', total: '$86.900' },
];

export function VistaPreviaPanel() {
  const maximo = Math.max(...VENTAS_SEMANA.map((d) => d.valor));

  return (
    <div
      role="img"
      aria-label="Vista previa del panel de administración de sucursal de Inventa con ventas, facturas y gráfico semanal"
      className="vidrio relative min-w-0 p-4 sm:p-5 flex flex-col gap-4 select-none"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-ambar/60 to-transparent" />
      {/* Barra de ventana */}
      <div className="flex items-center gap-2" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-text-muted/30" />
        <span className="size-2.5 rounded-full bg-text-muted/30" />
        <span className="size-2.5 rounded-full bg-text-muted/30" />
        <LayoutDashboard className="ml-1 size-4 text-brand-600 dark:text-brand-300" />
        <span className="font-sans text-[13px] text-text-muted">Admin de sucursal · Sede Norte</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-hidden="true">
        {KPIS.map((k) => (
          <div key={k.etiqueta} className="vidrio px-4 py-3.5 flex flex-col gap-1">
            <span className="font-sans text-[13px] text-text-muted">{k.etiqueta}</span>
            <span className="font-titulos text-2xl font-semibold tracking-[-0.005em] text-text tabular-nums">
              {k.valor}
            </span>
            <span className="flex items-center gap-1 font-sans text-[13px] text-green-600 dark:text-green-300 tabular-nums">
              <TrendingUp className="size-3.5" />
              {k.variacion}
            </span>
          </div>
        ))}
      </div>

      {/* Gráfico de barras */}
      <div className="vidrio p-4 flex flex-col gap-3.5" aria-hidden="true">
        <div className="flex items-center justify-between">
          <span className="font-sans text-sm font-medium text-text">Ventas de los últimos 7 días</span>
          <span className="font-sans text-[13px] text-text-muted">COP</span>
        </div>
        <div className="flex items-end gap-3 h-[120px]">
          {VENTAS_SEMANA.map((d, i) => (
            <div key={d.dia} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
              <div
                className={`w-full rounded-t-md ${i === 5 ? 'bg-brand-500' : 'bg-brand-600/55'}`}
                style={{ height: `${(d.valor / maximo) * 100}%` }}
              />
              <span className="font-sans text-[13px] text-text-muted">{d.dia}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ventas recientes */}
      <div className="vidrio overflow-hidden" aria-hidden="true">
        <div className="grid grid-cols-[minmax(0,118px)_minmax(0,1fr)_auto] gap-3 px-4 py-2.5 superficie-control rounded-none border-0">
          <span className="text-[11px] uppercase tracking-wider font-medium text-text-muted">Consecutivo</span>
          <span className="text-[11px] uppercase tracking-wider font-medium text-text-muted">Cliente</span>
          <span className="text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Total</span>
        </div>
        {VENTAS_RECIENTES.map((v) => (
          <div key={v.consecutivo} className="grid grid-cols-[minmax(0,118px)_minmax(0,1fr)_auto] gap-3 px-4 py-3 border-t border-border items-center">
            <span className="font-mono text-xs text-brand-600 dark:text-brand-300 truncate">{v.consecutivo}</span>
            <span className="font-sans text-[13px] text-text truncate">{v.cliente}</span>
            <span className="font-sans text-[13px] text-text tabular-nums text-right">{v.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
