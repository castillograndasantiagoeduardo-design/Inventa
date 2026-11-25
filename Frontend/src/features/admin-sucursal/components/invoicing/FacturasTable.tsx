'use client';

/**
 * FacturasTable.tsx — Tabla responsive de comprobantes fiscales de la sucursal.
 *
 * En escritorio: tabla semántica con encabezados accesibles y sin scroll horizontal roto.
 * En pantallas móviles (<768px): tarjetas apiladas limpias (`md:hidden`).
 */

import React from 'react';
import { Eye } from 'lucide-react';
import type { FacturaSede } from '../../types/branch-invoicing.types';

interface FacturasTableProps {
  facturas: FacturaSede[];
  onVerDetalle: (facturaId: string) => void;
}

export function FacturasTable({ facturas, onVerDetalle }: FacturasTableProps) {
  return (
    <div className="space-y-3">
      {/* ─── Vista Escritorio (>= md) ─────────────────────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border vidrio">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-text-muted text-[11px] font-mono uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Fecha / Hora</th>
              <th scope="col" className="py-3 px-4">Folio</th>
              <th scope="col" className="py-3 px-4">Cliente</th>
              <th scope="col" className="py-3 px-4">Cajero</th>
              <th scope="col" className="py-3 px-4 text-center">Canal</th>
              <th scope="col" className="py-3 px-4 text-right">Total</th>
              <th scope="col" className="py-3 px-4 text-center">Estado</th>
              <th scope="col" className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {facturas.map((fac) => {
              const esAnulada = fac.estado === 'anulada';
              return (
                <tr
                  key={fac.id}
                  className="hover:bg-slate-900/5 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4 text-text-muted font-mono text-[11px]">
                    {fac.fechaFormateada}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-text">
                    {fac.folioFormateado}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-text block">
                      {fac.clienteNombre || 'Consumidor Final'}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      Doc: {fac.clienteDocumento || '222222222222'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text">
                    {fac.cajeroNombre || '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                        fac.tipoVenta === 'B2B'
                          ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {fac.tipoVenta || 'POS'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                    {fac.totalFormateado}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                        esAnulada
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {esAnulada ? 'Anulada' : 'Emitida'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onVerDetalle(fac.id)}
                      aria-label={`Ver detalle del comprobante ${fac.folioFormateado}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border superficie-control text-text hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-300 transition-all text-xs font-semibold cursor-pointer"
                    >
                      <Eye size={14} aria-hidden="true" />
                      <span>Detalle</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Vista Móvil (< md): Tarjetas apiladas ───────────────────── */}
      <div className="md:hidden space-y-3">
        {facturas.map((fac) => {
          const esAnulada = fac.estado === 'anulada';
          return (
            <div
              key={fac.id}
              className="p-4 rounded-2xl border border-border vidrio space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-text text-sm block">
                    {fac.folioFormateado}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono">
                    {fac.fechaFormateada}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                      fac.tipoVenta === 'B2B'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                        : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {fac.tipoVenta || 'POS'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                      esAnulada
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {esAnulada ? 'Anulada' : 'Emitida'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border">
                <div>
                  <span className="text-[10px] text-text-muted font-mono block">Cliente</span>
                  <span className="font-semibold text-text block truncate">
                    {fac.clienteNombre || 'Consumidor Final'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-mono block">Cajero</span>
                  <span className="text-text block truncate">
                    {fac.cajeroNombre || '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <span className="text-[10px] text-text-muted font-mono block">Total</span>
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-base">
                    {fac.totalFormateado}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onVerDetalle(fac.id)}
                  aria-label={`Ver detalle del comprobante ${fac.folioFormateado}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border superficie-control text-text hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-300 transition-all text-xs font-semibold cursor-pointer"
                >
                  <Eye size={14} aria-hidden="true" />
                  <span>Ver Detalle</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
