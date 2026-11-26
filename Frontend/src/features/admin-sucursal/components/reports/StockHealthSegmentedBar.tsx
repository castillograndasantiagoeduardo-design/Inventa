'use client';

import React from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { SaludStockDto } from '../../types/branch-reports.types';
import { CheckCircle2, AlertTriangle, XCircle, DollarSign } from 'lucide-react';

interface StockHealthSegmentedBarProps {
  saludStock: SaludStockDto;
  valorTotalInventario?: number;
  className?: string;
}

export function StockHealthSegmentedBar({
  saludStock,
  valorTotalInventario,
  className = '',
}: StockHealthSegmentedBarProps) {
  const { totalProductos, optimo, bajo, agotado, porcentajeSaludable } = saludStock;
  const divisor = Math.max(1, totalProductos);

  const pctOptimo = (optimo / divisor) * 100;
  const pctBajo = (bajo / divisor) * 100;
  const pctAgotado = (agotado / divisor) * 100;

  return (
    <div className={`vidrio rounded-2xl p-5 border border-border shadow-xs ${className}`}>
      {/* Cabecera y Valor Total */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text font-sans">
            Salud y disponibilidad del inventario
          </h3>
          <p className="text-xs text-text-muted font-sans">
            Disponibilidad operativa calculada sobre {totalProductos} productos activos
          </p>
        </div>

        {valorTotalInventario !== undefined && valorTotalInventario > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <DollarSign className="w-4 h-4 text-[#e3b341]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">
                Valor del inventario
              </span>
              <span className="text-sm font-bold font-mono text-text tabular-nums">
                {formatCOP(valorTotalInventario)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Métrica principal y porcentaje */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-text tabular-nums">
            {porcentajeSaludable}%
          </span>
          <span className="text-xs text-text-muted font-sans">
            en nivel óptimo
          </span>
        </div>
        <span className="text-xs text-text-muted font-mono tabular-nums">
          {optimo} / {totalProductos}
        </span>
      </div>

      {/* Barra de progreso tricolor segmentada */}
      <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-slate-800/40 my-3">
        <div
          className="h-full bg-[#10b981] rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
          style={{ width: `${Math.max(2, pctOptimo)}%` }}
          title={`Óptimo: ${optimo}`}
        />
        {bajo > 0 && (
          <div
            className="h-full bg-[#f59e0b] rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
            style={{ width: `${Math.max(2, pctBajo)}%` }}
            title={`Stock bajo: ${bajo}`}
          />
        )}
        {agotado > 0 && (
          <div
            className="h-full bg-[#ef4444] rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
            style={{ width: `${Math.max(2, pctAgotado)}%` }}
            title={`Agotado: ${agotado}`}
          />
        )}
      </div>

      {/* Chips de estado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
        {/* Óptimo */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-sans font-medium text-text">Óptimo</span>
          </div>
          <span className="font-mono font-bold text-text tabular-nums">{optimo}</span>
        </div>

        {/* Bajo */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-sans font-medium text-text">Stock bajo</span>
          </div>
          <span className="font-mono font-bold text-text tabular-nums">{bajo}</span>
        </div>

        {/* Agotado */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span className="font-sans font-medium text-text">Agotado</span>
          </div>
          <span className="font-mono font-bold text-text tabular-nums">{agotado}</span>
        </div>
      </div>
    </div>
  );
}
