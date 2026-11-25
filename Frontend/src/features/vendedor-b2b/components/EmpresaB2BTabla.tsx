'use client';

/**
 * EmpresaB2BTabla.tsx — Tabla filtrable de empresas B2B ("Mis empresas") con
 * cupo, estado de crédito, rentabilidad generada frente al cupo y acciones.
 */

import React from 'react';
import Link from 'next/link';
import { Search, Sparkles, Eye, RotateCcw } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import { formatCOP, formatPorcentaje } from '@/lib/format/moneda';
import type { EmpresaB2BResumenDto, FiltrosEmpresasB2B } from '../types';
import { BADGE_ESTADO_CREDITO, BADGE_RIESGO } from './carteraBadges';

export interface EmpresaB2BTablaProps {
  empresas: EmpresaB2BResumenDto[];
  filtros: FiltrosEmpresasB2B;
  onChangeFiltros: (updater: (prev: FiltrosEmpresasB2B) => FiltrosEmpresasB2B) => void;
  onLimpiarFiltros: () => void;
  onSoltarCredito?: (empresa: EmpresaB2BResumenDto) => void;
  cargando?: boolean;
}

export function EmpresaB2BTabla({
  empresas,
  filtros,
  onChangeFiltros,
  onLimpiarFiltros,
  onSoltarCredito,
  cargando = false,
}: EmpresaB2BTablaProps) {
  const hayFiltros = Boolean(
    filtros.buscar || filtros.estadoCredito || filtros.soloEnMora || filtros.conCartera,
  );

  return (
    <div className="space-y-4">
      <div className="vidrio p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filtros.buscar ?? ''}
            onChange={(e) =>
              onChangeFiltros((prev) => ({ ...prev, buscar: e.target.value }))
            }
            placeholder="Buscar empresa por razón social, NIT o correo..."
            className="w-full superficie-control rounded-xl pl-9 pr-3 py-2 text-xs font-sans text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtros.estadoCredito ?? ''}
            onChange={(e) =>
              onChangeFiltros((prev) => ({
                ...prev,
                estadoCredito: (e.target.value || undefined) as FiltrosEmpresasB2B['estadoCredito'],
              }))
            }
            aria-label="Filtrar por estado de crédito"
            className="superficie-control rounded-xl px-3 py-2 text-xs font-sans text-text focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-bg text-text">Todos los estados</option>
            <option value="aprobado" className="bg-bg text-text">Aprobado</option>
            <option value="pendiente_aprobacion" className="bg-bg text-text">Pendiente</option>
            <option value="rechazado" className="bg-bg text-text">Rechazado</option>
            <option value="sin_solicitud" className="bg-bg text-text">Sin solicitud</option>
          </select>

          <button
            type="button"
            onClick={() =>
              onChangeFiltros((prev) => ({ ...prev, soloEnMora: !prev.soloEnMora }))
            }
            className={`px-3 py-2 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
              filtros.soloEnMora
                ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/35'
                : 'superficie-control text-text-muted hover:text-text'
            }`}
          >
            Solo en mora
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeFiltros((prev) => ({ ...prev, conCartera: !prev.conCartera }))
            }
            className={`px-3 py-2 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
              filtros.conCartera
                ? 'bg-brand-600/15 text-brand-700 dark:text-brand-300 border border-brand-500/35'
                : 'superficie-control text-text-muted hover:text-text'
            }`}
          >
            Con cartera
          </button>

          {hayFiltros && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans font-medium text-text-muted hover:text-text cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      <Tarjeta
        titulo="Empresas B2B registradas"
        subtitulo={`${empresas.length} empresa(s) corporativa(s) visibles en tu sucursal`}
        sinRelleno
      >
        {cargando ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl superficie-control animate-pulse" />
            ))}
          </div>
        ) : empresas.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-titulos font-semibold text-text">
              No hay empresas que coincidan con los filtros
            </p>
            <p className="text-xs font-sans text-text-muted">
              Ajusta los filtros o registra una nueva empresa B2B desde el Catálogo B2B.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">
                    Empresa
                  </th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">
                    Crédito / Riesgo
                  </th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">
                    Cupo (Aprob. / Disp.)
                  </th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">
                    Ganancia vs. Crédito
                  </th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted">
                    Cartera y Mora
                  </th>
                  <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-medium text-text-muted text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-sans">
                {empresas.map((emp) => {
                  const badgeEstado = BADGE_ESTADO_CREDITO[emp.estadoCredito];
                  const badgeRiesgo = emp.nivelRiesgoCredito
                    ? BADGE_RIESGO[emp.nivelRiesgoCredito]
                    : null;
                  const puedeSoltarCredito =
                    !emp.creditoHabilitado && emp.estadoCredito !== 'aprobado';

                  return (
                    <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-medium text-text">{emp.nombreRazonSocial}</p>
                        <p className="text-[11px] font-mono text-text-muted mt-0.5">
                          {emp.tipoDocumento} {emp.numeroDocumento}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Insignia variante={badgeEstado.variante} conPunto>
                            {badgeEstado.label}
                          </Insignia>
                          {badgeRiesgo && (
                            <Insignia variante={badgeRiesgo.variante}>{badgeRiesgo.label}</Insignia>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted mt-1 tabular-nums">
                          Plazo: {emp.plazoCreditoDias ?? 30} días
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right tabular-nums">
                        <p className="font-medium text-text">{formatCOP(emp.cupoCreditoAprobado)}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Disp: {formatCOP(emp.cupoCreditoDisponible)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right tabular-nums">
                        <p className="font-medium text-text">{formatCOP(emp.gananciaGenerada)}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {emp.rentabilidadSobreCredito !== null
                            ? `Retorno: ${formatPorcentaje(emp.rentabilidadSobreCredito * 100)}`
                            : 'Sin cupo asignado'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        {emp.creditosEnMoraCount > 0 ? (
                          <div className="space-y-1">
                            <Insignia variante="danger" conPunto>
                              Mora {emp.diasMoraMax}d · {formatCOP(emp.montoVencido)}
                            </Insignia>
                            <p className="text-[11px] text-text-muted tabular-nums">
                              {emp.creditosVigentesCount} vig. · {emp.creditosPagadosCount} pag.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5 tabular-nums">
                            <p className="text-text">
                              {emp.creditosVigentesCount} vigente(s) · {emp.creditosPagadosCount} pagado(s)
                            </p>
                            {emp.antiguedadCarteraDias !== null && (
                              <p className="text-[11px] text-text-muted">
                                Antigüedad máx: {emp.antiguedadCarteraDias} días
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {puedeSoltarCredito && onSoltarCredito && (
                            <button
                              type="button"
                              onClick={() => onSoltarCredito(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Soltar crédito</span>
                            </button>
                          )}
                          <Link
                            href={`/vendedor-b2b/empresas/${emp.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl superficie-control text-text hover:text-brand-400 text-[11px] font-medium transition-colors whitespace-nowrap"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver detalle</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
