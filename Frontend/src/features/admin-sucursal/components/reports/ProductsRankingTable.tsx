'use client';

import React from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type {
  CriterioOrdenProductos,
  ItemProductoSinVentasDto,
  ItemRankingProductoDto,
} from '../../types/branch-reports.types';
import { Trophy, PackageX } from 'lucide-react';

interface ProductsRankingTableProps {
  ranking: ItemRankingProductoDto[];
  sinVentas: ItemProductoSinVentasDto[];
  orden: CriterioOrdenProductos;
  onCambiarOrden: (nuevoOrden: CriterioOrdenProductos) => void;
  limite: number;
  onCambiarLimite: (nuevoLimite: number) => void;
  className?: string;
}

export function ProductsRankingTable({
  ranking,
  sinVentas,
  orden,
  onCambiarOrden,
  limite,
  onCambiarLimite,
  className = '',
}: ProductsRankingTableProps) {
  const maxMetrica =
    ranking.length > 0
      ? Math.max(
          ...ranking.map((r) =>
            orden === 'ingresos' ? r.ingresosTotales : r.unidadesVendidas,
          ),
        )
      : 1;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Panel de Ranking Principal */}
      <div className="vidrio rounded-2xl p-5 border border-border shadow-xs">
        {/* Controles de ordenamiento y Top N */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#e3b341]" />
            <h3 className="text-sm font-semibold text-text font-sans">
              Ranking de productos más destacados
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle de criterio */}
            <div className="inline-flex items-center p-1 rounded-xl superficie-control border border-border text-xs font-sans">
              <button
                type="button"
                onClick={() => onCambiarOrden('ingresos')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  orden === 'ingresos'
                    ? 'bg-brand-600/20 text-brand-700 dark:text-slate-100 font-semibold border border-brand-600/40 shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Por ingresos
              </button>
              <button
                type="button"
                onClick={() => onCambiarOrden('unidades')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  orden === 'unidades'
                    ? 'bg-brand-600/20 text-brand-700 dark:text-slate-100 font-semibold border border-brand-600/40 shadow-xs'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Por unidades
              </button>
            </div>

            {/* Selector de Top N */}
            <div className="flex items-center gap-1.5 text-xs text-text-muted font-sans">
              <span>Top:</span>
              <select
                aria-label="Cantidad de productos en ranking"
                value={limite}
                onChange={(e) => onCambiarLimite(Number(e.target.value))}
                className="px-2 py-1 rounded-xl superficie-control border border-border text-text font-sans focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {ranking.length === 0 ? (
          <p className="text-xs text-text-muted font-sans py-4 text-center">
            No se registraron ventas de productos en el rango de fechas seleccionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans text-left">
              <thead>
                <tr className="border-b border-border/80 text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3 text-right">Unidades</th>
                  <th className="py-2.5 px-3 text-right">Ingresos generados</th>
                  <th className="py-2.5 px-3 w-40">Proporción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {ranking.map((item) => {
                  const valorCriterio =
                    orden === 'ingresos' ? item.ingresosTotales : item.unidadesVendidas;
                  const porcentajeBarra = Math.round((valorCriterio / maxMetrica) * 100);

                  return (
                    <tr key={item.productoId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-text-muted">
                        {item.posicion === 1 ? (
                          <span className="text-[#e3b341]">🥇</span>
                        ) : item.posicion === 2 ? (
                          <span className="text-slate-300">🥈</span>
                        ) : item.posicion === 3 ? (
                          <span className="text-amber-700">🥉</span>
                        ) : (
                          item.posicion
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-text">{item.nombre}</div>
                        <div className="text-[10px] text-text-muted font-mono">{item.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">
                        {item.categoriaNombre || 'Sin categoría'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-text font-medium">
                        {item.unidadesVendidas.toLocaleString('es-CO')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-text font-semibold">
                        {formatCOP(item.ingresosTotales)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-full bg-slate-800/40 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#e3b341] h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(227,179,65,0.4)]"
                            style={{ width: `${Math.max(5, porcentajeBarra)}%` }}
                            title={`${porcentajeBarra}% del máximo`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Sección: Productos sin ventas en el período */}
      {sinVentas.length > 0 && (
        <div className="vidrio rounded-2xl p-5 border border-border shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <PackageX className="w-4 h-4 text-text-muted" />
            <div>
              <h3 className="text-sm font-semibold text-text font-sans">
                Productos activos sin ventas en el período
              </h3>
              <p className="text-xs text-text-muted font-sans">
                Artículos con inventario en la sede que no registraron rotación en este rango de fechas
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans text-left">
              <thead>
                <tr className="border-b border-border/80 text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-3">Categoría</th>
                  <th className="py-2 px-3 text-right">Stock actual en sede</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {sinVentas.map((sv) => (
                  <tr key={sv.productoId} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-mono text-text-muted">{sv.sku}</td>
                    <td className="py-2 px-3 font-medium text-text">{sv.nombre}</td>
                    <td className="py-2 px-3 text-text-muted">{sv.categoriaNombre || 'Sin categoría'}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-text">
                      {sv.stockActual}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
