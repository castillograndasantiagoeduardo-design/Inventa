'use client';

/**
 * CarteraPanel.tsx — Panel de obligaciones de cartera B2B (vigentes, pagadas y en mora),
 * mostrando la antigüedad ("tiempo pagando"), resumen consolidado y botón "Avisar pago".
 */

import React from 'react';
import Link from 'next/link';
import { BellRing, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import { formatCOP } from '@/lib/format/moneda';
import type { CreditoB2BDto, EstadoCarteraB2B } from '../types';
import { BADGE_ESTADO_CARTERA } from './carteraBadges';

export interface CarteraPanelProps {
  creditos: CreditoB2BDto[];
  totalCreditos: number;
  pagina: number;
  limite: number;
  estadoFiltro?: EstadoCarteraB2B;
  resumen: {
    vigentes: number;
    pagados: number;
    enMora: number;
    saldoTotal: number;
  } | null;
  cargando?: boolean;
  error?: string | null;
  onCambiarEstado: (estado?: EstadoCarteraB2B) => void;
  onCambiarPagina: (pagina: number) => void;
  onAvisarPago: (credito: CreditoB2BDto) => void;
}

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export function CarteraPanel({
  creditos,
  totalCreditos,
  pagina,
  limite,
  estadoFiltro,
  resumen,
  cargando = false,
  error = null,
  onCambiarEstado,
  onCambiarPagina,
  onAvisarPago,
}: CarteraPanelProps) {
  const totalPaginas = Math.max(1, Math.ceil(totalCreditos / limite));

  return (
    <div className="space-y-4">
      <div className="vidrio p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: undefined, label: 'Todos' },
              { key: 'vigente', label: `Vigentes (${resumen?.vigentes ?? 0})` },
              { key: 'en_mora', label: `En mora (${resumen?.enMora ?? 0})` },
              { key: 'pagado', label: `Pagados (${resumen?.pagados ?? 0})` },
            ] as const
          ).map((op) => {
            const activo = estadoFiltro === op.key;
            return (
              <button
                key={op.label}
                type="button"
                onClick={() => onCambiarEstado(op.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
                  activo
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'superficie-control text-text-muted hover:text-text'
                }`}
              >
                {op.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs font-sans text-text-muted tabular-nums">
          Saldo vigente total:{' '}
          <span className="font-semibold text-text">
            {formatCOP(resumen?.saldoTotal ?? 0)}
          </span>
        </p>
      </div>

      {error && (
        <div className="vidrio p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      <Tarjeta
        titulo="Cartera y tiempo pagando"
        subtitulo="Seguimiento de obligaciones emitidas a crédito corporativo y días transcurridos"
        sinRelleno
      >
        {cargando ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl superficie-control animate-pulse" />
            ))}
          </div>
        ) : creditos.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Clock className="w-7 h-7 text-text-muted mx-auto" />
            <p className="text-sm font-titulos font-semibold text-text">
              Sin obligaciones para este filtro
            </p>
            <p className="text-xs font-sans text-text-muted">
              Cuando se emitan facturas a crédito corporativo aparecerán aquí con su plazo y antigüedad.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Factura / Empresa</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Tiempo pagando</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Monto / Abonado</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Saldo</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Estado</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-sans">
                {creditos.map((cred) => {
                  const badge = BADGE_ESTADO_CARTERA[cred.estado];
                  return (
                    <tr key={cred.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-mono text-text">
                          FAC-{String(cred.facturaConsecutivo).padStart(4, '0')}
                        </span>
                        <Link
                          href={`/vendedor-b2b/empresas/${cred.clienteId}`}
                          className="block font-medium text-brand-400 hover:underline mt-0.5"
                        >
                          {cred.clienteNombre}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 align-top tabular-nums">
                        <p className="text-text font-medium">{cred.diasTranscurridos} días</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Vence: {fechaCorta(cred.fechaVencimiento)}
                          {cred.diasMora > 0 ? ` · ${cred.diasMora}d mora` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right tabular-nums">
                        <p className="text-text">{formatCOP(cred.monto)}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Abonado: {formatCOP(cred.totalAbonado)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right tabular-nums font-medium text-text">
                        {formatCOP(cred.saldo)}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <Insignia variante={badge.variante} conPunto>{badge.label}</Insignia>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right">
                        {cred.estado !== 'pagado' ? (
                          <button
                            type="button"
                            onClick={() => onAvisarPago(cred)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <BellRing className="w-3 h-3" />
                            <span>Avisar pago</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-text-muted">Saldado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-text-muted tabular-nums">
            <span>
              Página {pagina} de {totalPaginas} ({totalCreditos} registros)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => onCambiarPagina(pagina - 1)}
                className="p-1.5 rounded-lg superficie-control disabled:opacity-40 cursor-pointer"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => onCambiarPagina(pagina + 1)}
                className="p-1.5 rounded-lg superficie-control disabled:opacity-40 cursor-pointer"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
