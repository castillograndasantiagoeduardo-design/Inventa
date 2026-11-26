'use client';

import React from 'react';
import Link from 'next/link';
import type { ItemProductoBajoMinimoDto } from '../../types/branch-reports.types';
import { ExternalLink, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

interface LowStockReportTableProps {
  items: ItemProductoBajoMinimoDto[];
  total: number;
  page: number;
  totalPaginas: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function LowStockReportTable({
  items,
  total,
  page,
  totalPaginas,
  onPageChange,
  className = '',
}: LowStockReportTableProps) {
  return (
    <div className={`vidrio rounded-2xl p-5 border border-border shadow-xs ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-text font-sans">
              Productos que requieren reposición
            </h3>
            <p className="text-xs text-text-muted font-sans">
              {total} producto(s) por debajo del stock mínimo o sin existencias
            </p>
          </div>
        </div>

        <Link
          href="/admin-sucursal/inventario?filtro=stock_bajo"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl superficie-control border border-border text-xs text-brand-500 hover:text-brand-400 font-sans transition-all"
        >
          <span>Ir a Inventario</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-text-muted font-sans py-4 text-center">
          Todo el inventario se encuentra en niveles saludables (óptimo).
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans text-left">
              <thead>
                <tr className="border-b border-border/80 text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3 text-right">Stock Actual</th>
                  <th className="py-2.5 px-3 text-right">Mínimo</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((item) => {
                  const esAgotado = item.estadoStock === 'agotado';
                  return (
                    <tr key={item.productoId} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono text-text-muted">{item.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-text">{item.nombre}</td>
                      <td className="py-2.5 px-3 text-text-muted">
                        {item.categoriaNombre || 'Sin categoría'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-text">
                        {item.stockActual}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-text-muted">
                        {item.stockMinimo}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold uppercase tracking-wider ${
                            esAgotado
                              ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          }`}
                        >
                          {esAgotado ? 'Agotado' : 'Bajo mínimo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border/80 text-xs text-text-muted font-sans">
              <span>
                Página {page} de {totalPaginas}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg superficie-control border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:text-text"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPaginas}
                  className="p-1.5 rounded-lg superficie-control border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:text-text"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
