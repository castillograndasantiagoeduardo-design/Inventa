'use client';

/**
 * CarteraKPIs.tsx — Tarjetas ejecutivas KPI de cartera corporativa B2B (.vidrio).
 */

import React from 'react';
import { Building2, Wallet, AlertTriangle, TrendingUp } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import { formatCOP, formatNumero } from '@/lib/format/moneda';
import type { ResumenCarteraDto } from '../types';

export interface CarteraKPIsProps {
  resumen: ResumenCarteraDto | null;
  cargando?: boolean;
}

export function CarteraKPIs({ resumen, cargando = false }: CarteraKPIsProps) {
  if (cargando && !resumen) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="vidrio p-5 h-32 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const r = resumen ?? {
    totalEmpresasB2B: 0,
    empresasConCredito: 0,
    cupoTotalAprobado: 0,
    cupoTotalUtilizado: 0,
    cupoTotalDisponible: 0,
    saldoTotalPendiente: 0,
    montoTotalVencido: 0,
    empresasEnMora: 0,
    creditosVigentesCount: 0,
    creditosPagadosCount: 0,
    gananciaTotalGenerada: 0,
    avisosPendientesCount: 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Tarjeta>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-sans font-medium text-text-muted">Empresas B2B</p>
            <p className="mt-2 text-2xl sm:text-3xl font-titulos font-semibold tracking-[-0.005em] text-text tabular-nums">
              {formatNumero(r.totalEmpresasB2B)}
            </p>
          </div>
          <span className="p-2 rounded-xl bg-brand-500/12 text-brand-500 shrink-0">
            <Building2 className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Insignia variante="brand" tamano="sm">
            {r.empresasConCredito} con crédito activo
          </Insignia>
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-sans font-medium text-text-muted">Cupo disponible</p>
            <p className="mt-2 text-2xl font-titulos font-semibold tracking-[-0.005em] text-text tabular-nums truncate">
              {formatCOP(r.cupoTotalDisponible)}
            </p>
          </div>
          <span className="p-2 rounded-xl bg-sky-500/12 text-sky-400 shrink-0">
            <Wallet className="w-4 h-4" />
          </span>
        </div>
        <p className="mt-3 text-[11px] font-sans text-text-muted tabular-nums truncate">
          Aprobado: {formatCOP(r.cupoTotalAprobado)} · Uso: {formatCOP(r.cupoTotalUtilizado)}
        </p>
      </Tarjeta>

      <Tarjeta>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-sans font-medium text-text-muted">Saldo y mora</p>
            <p className="mt-2 text-2xl font-titulos font-semibold tracking-[-0.005em] text-text tabular-nums truncate">
              {formatCOP(r.saldoTotalPendiente)}
            </p>
          </div>
          <span className="p-2 rounded-xl bg-amber-500/12 text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Insignia variante={r.empresasEnMora > 0 ? 'danger' : 'success'} tamano="sm" conPunto>
            {r.empresasEnMora > 0
              ? `${r.empresasEnMora} en mora (${formatCOP(r.montoTotalVencido)})`
              : 'Sin mora vencida'}
          </Insignia>
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-sans font-medium text-text-muted">Ganancia generada</p>
            <p className="mt-2 text-2xl font-titulos font-semibold tracking-[-0.005em] text-text tabular-nums truncate">
              {formatCOP(r.gananciaTotalGenerada)}
            </p>
          </div>
          <span className="p-2 rounded-xl bg-green-500/12 text-green-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <p className="mt-3 text-[11px] font-sans text-text-muted tabular-nums truncate">
          Vigentes: {r.creditosVigentesCount} · Pagados: {r.creditosPagadosCount} · Avisos: {r.avisosPendientesCount}
        </p>
      </Tarjeta>
    </div>
  );
}
