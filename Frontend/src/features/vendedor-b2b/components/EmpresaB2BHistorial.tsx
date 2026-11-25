'use client';

/**
 * EmpresaB2BHistorial.tsx — Tablas de obligaciones de crédito, abonos aplicados
 * y avisos de pago para el detalle de una empresa B2B.
 */

import React from 'react';
import { BellRing } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import { formatCOP } from '@/lib/format/moneda';
import type {
  AbonoCreditoDto,
  AvisoPagoCreditoDto,
  CreditoB2BDto,
} from '../types';
import { BADGE_ESTADO_AVISO, BADGE_ESTADO_CARTERA } from './carteraBadges';

export interface EmpresaB2BHistorialProps {
  creditos: CreditoB2BDto[];
  abonosRecientes: AbonoCreditoDto[];
  avisosPago: AvisoPagoCreditoDto[];
  onAvisarPago?: (credito: CreditoB2BDto) => void;
}

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export function EmpresaB2BHistorial({
  creditos,
  abonosRecientes,
  avisosPago,
  onAvisarPago,
}: EmpresaB2BHistorialProps) {
  return (
    <div className="space-y-6">
      <Tarjeta
        titulo="Obligaciones de cartera"
        subtitulo={`${creditos.length} crédito(s) emitido(s) a crédito corporativo`}
        sinRelleno
      >
        {creditos.length === 0 ? (
          <p className="p-6 text-xs font-sans text-text-muted">
            Esta empresa aún no registra facturas a crédito en cartera.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Factura</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Emisión / Vencimiento</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Monto</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Saldo</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Estado</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-sans">
                {creditos.map((c) => {
                  const badge = BADGE_ESTADO_CARTERA[c.estado];
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-text">
                        FAC-{String(c.facturaConsecutivo).padStart(4, '0')}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-text-muted">
                        <span>{fechaCorta(c.fechaEmision)} → {fechaCorta(c.fechaVencimiento)}</span>
                        <span className="block text-[11px]">
                          Tiempo pagando: {c.diasTranscurridos} días
                          {c.diasMora > 0 ? ` · Mora: ${c.diasMora}d` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-text">
                        {formatCOP(c.monto)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium text-text">
                        {formatCOP(c.saldo)}
                      </td>
                      <td className="py-3 px-4">
                        <Insignia variante={badge.variante} conPunto>{badge.label}</Insignia>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.estado !== 'pagado' && onAvisarPago ? (
                          <button
                            type="button"
                            onClick={() => onAvisarPago(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <BellRing className="w-3 h-3" />
                            <span>Avisar pago</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Tarjeta titulo="Avisos de pago reportados" subtitulo={`${avisosPago.length} registro(s)`} sinRelleno>
          {avisosPago.length === 0 ? (
            <p className="p-6 text-xs font-sans text-text-muted">Sin avisos de pago registrados.</p>
          ) : (
            <div className="divide-y divide-border">
              {avisosPago.map((av) => {
                const badge = BADGE_ESTADO_AVISO[av.estado];
                return (
                  <div key={av.id} className="p-4 flex items-start justify-between gap-3 text-xs font-sans">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-text">{av.referencia}</span>
                        <Insignia variante={badge.variante} conPunto>{badge.label}</Insignia>
                      </div>
                      <p className="text-[11px] text-text-muted tabular-nums">
                        FAC-{String(av.facturaConsecutivo).padStart(4, '0')} · {fechaCorta(av.fechaAviso)}
                      </p>
                      {av.motivoRechazo && (
                        <p className="text-[11px] text-red-400">Motivo rechazo: {av.motivoRechazo}</p>
                      )}
                    </div>
                    <span className="font-medium text-text tabular-nums shrink-0">
                      {formatCOP(av.monto)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Abonos aplicados" subtitulo={`${abonosRecientes.length} movimiento(s)`} sinRelleno>
          {abonosRecientes.length === 0 ? (
            <p className="p-6 text-xs font-sans text-text-muted">Sin abonos confirmados aún.</p>
          ) : (
            <div className="divide-y divide-border">
              {abonosRecientes.map((ab) => (
                <div key={ab.id} className="p-4 flex items-center justify-between gap-3 text-xs font-sans">
                  <div className="min-w-0">
                    <p className="text-text font-medium tabular-nums">{fechaCorta(ab.fecha)}</p>
                    <p className="text-[11px] text-text-muted truncate">
                      Confirmado por: {ab.registradoPorNombre ?? 'Administración'}
                    </p>
                  </div>
                  <span className="font-medium text-green-400 tabular-nums shrink-0">
                    +{formatCOP(ab.monto)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
