'use client';

import React from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { DesgloseMetodoPagoDto } from '../../types/branch-reports.types';
import { CreditCard, Banknote, Landmark, Briefcase } from 'lucide-react';

interface PaymentMethodsBarProps {
  desglose: DesgloseMetodoPagoDto[];
  className?: string;
}

const CONFIG_METODOS: Record<
  string,
  { label: string; color: string; bgClass: string; icon: React.ReactNode }
> = {
  efectivo: {
    label: 'Efectivo',
    color: '#10b981',
    bgClass: 'bg-emerald-500',
    icon: <Banknote className="w-3.5 h-3.5" />,
  },
  transferencia: {
    label: 'Transferencia',
    color: '#3b82f6',
    bgClass: 'bg-blue-500',
    icon: <Landmark className="w-3.5 h-3.5" />,
  },
  tarjeta: {
    label: 'Tarjeta débito / crédito',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500',
    icon: <CreditCard className="w-3.5 h-3.5" />,
  },
  credito_corporativo: {
    label: 'Crédito corporativo',
    color: '#f59e0b',
    bgClass: 'bg-amber-500',
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
};

export function PaymentMethodsBar({
  desglose,
  className = '',
}: PaymentMethodsBarProps) {
  if (desglose.length === 0) {
    return (
      <div className={`vidrio rounded-2xl p-5 border border-border ${className}`}>
        <h3 className="text-sm font-semibold text-text font-sans mb-2">
          Desglose por método de pago
        </h3>
        <p className="text-xs text-text-muted font-sans">
          Sin transacciones registradas en el período.
        </p>
      </div>
    );
  }

  const totalRecaudado = desglose.reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div className={`vidrio rounded-2xl p-5 border border-border shadow-xs ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-text font-sans">
            Desglose por método de pago
          </h3>
          <p className="text-xs text-text-muted font-sans">
            Distribución proporcional de ingresos recaudados
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-text tabular-nums">
          {formatCOP(totalRecaudado)}
        </span>
      </div>

      {/* Barra proporcional segmentada */}
      <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-slate-800/40 my-3">
        {desglose.map((m, idx) => {
          const cfg = CONFIG_METODOS[m.medioPago] || {
            label: m.medioPago,
            color: '#64748b',
            bgClass: 'bg-slate-500',
            icon: null,
          };
          const pct = Math.max(2, m.porcentaje);
          return (
            <div
              key={idx}
              className={`h-full ${cfg.bgClass} rounded-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${cfg.label}: ${formatCOP(m.monto)} (${m.porcentaje}%)`}
            />
          );
        })}
      </div>

      {/* Lista detallada de métodos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
        {desglose.map((m, idx) => {
          const cfg = CONFIG_METODOS[m.medioPago] || {
            label: m.medioPago,
            color: '#64748b',
            bgClass: 'bg-slate-500',
            icon: null,
          };

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-border/60 text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="font-sans font-medium text-text truncate">
                  {cfg.label}
                </span>
              </div>
              <div className="text-right font-mono tabular-nums">
                <span className="font-semibold text-text">{formatCOP(m.monto)}</span>
                <span className="text-[11px] text-text-muted ml-2">({m.porcentaje}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
