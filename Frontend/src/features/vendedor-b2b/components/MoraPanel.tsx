'use client';

/**
 * MoraPanel.tsx — Panel de empresas corporativas B2B con obligaciones vencidas (en mora),
 * ordenadas por mayor cantidad de días de atraso y monto vencido.
 */

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Eye, Phone } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import { formatCOP } from '@/lib/format/moneda';
import type { EmpresaEnMoraDto } from '../types';

export interface MoraPanelProps {
  empresasMora: EmpresaEnMoraDto[];
  cargando?: boolean;
  error?: string | null;
}

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export function MoraPanel({
  empresasMora,
  cargando = false,
  error = null,
}: MoraPanelProps) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="vidrio p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      <Tarjeta
        titulo="Empresas en mora"
        subtitulo="Clientes con saldo pendiente y fecha de vencimiento superada"
        sinRelleno
      >
        {cargando ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-xl superficie-control animate-pulse" />
            ))}
          </div>
        ) : empresasMora.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
            <p className="text-sm font-titulos font-semibold text-text">
              Sin empresas en mora
            </p>
            <p className="text-xs font-sans text-text-muted">
              Todas las obligaciones de cartera B2B de tu sucursal se encuentran al día.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Empresa</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Contacto</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Mora máx.</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">Obligaciones</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Monto vencido</th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-sans">
                {empresasMora.map((item) => (
                  <tr key={item.clienteId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-medium text-text">{item.nombreRazonSocial}</p>
                      <p className="text-[11px] font-mono text-text-muted mt-0.5">
                        {item.tipoDocumento} {item.numeroDocumento}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 align-top text-text-muted tabular-nums">
                      {item.telefono ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{item.telefono}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <Insignia
                        variante="danger"
                        conPunto
                        icono={<AlertTriangle className="w-3 h-3" />}
                      >
                        {item.diasMoraMax} días
                      </Insignia>
                    </td>
                    <td className="py-3.5 px-4 align-top tabular-nums">
                      <p className="text-text">{item.creditosVencidosCount} vencido(s)</p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Más antiguo: {fechaCorta(item.creditoMasAntiguoVencido)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 align-top text-right tabular-nums font-medium text-red-400">
                      {formatCOP(item.montoVencido)}
                    </td>
                    <td className="py-3.5 px-4 align-top text-right">
                      <Link
                        href={`/vendedor-b2b/empresas/${item.clienteId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl superficie-control text-text hover:text-brand-400 text-[11px] font-medium transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Gestionar</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
