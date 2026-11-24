'use client';

import React, { useState } from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { ProductoInventarioSede } from '../../types/branch-inventory.types';

interface ProductsTableProps {
  productos: ProductoInventarioSede[];
  onSelectProducto: (producto: ProductoInventarioSede) => void;
  onVerKardex: (producto: ProductoInventarioSede) => void;
  onEditarProducto: (producto: ProductoInventarioSede) => void;
  onVerHistorialPrecios: (producto: ProductoInventarioSede) => void;
  onAjustarStockMinimo: (producto: ProductoInventarioSede) => void;
  onCambiarEstado: (producto: ProductoInventarioSede, nuevoEstado: boolean) => void;
}

export function ProductsTable({
  productos,
  onSelectProducto,
  onVerKardex,
  onEditarProducto,
  onVerHistorialPrecios,
  onAjustarStockMinimo,
  onCambiarEstado,
}: ProductsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full">
      {/* Vista de escritorio: Tabla semántica */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border text-text-muted font-semibold tracking-wider uppercase text-[11px]">
              <th scope="col" className="py-3 px-4">Producto</th>
              <th scope="col" className="py-3 px-4">Categoría</th>
              <th scope="col" className="py-3 px-4">Stock de la sede</th>
              <th scope="col" className="py-3 px-4 text-center">Mínimo</th>
              <th scope="col" className="py-3 px-4 text-right">Precio</th>
              <th scope="col" className="py-3 px-4 text-center">Nivel</th>
              <th scope="col" className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {productos.map((p) => {
              const stock = p.stockActual ?? 0;
              const min = p.stockMinimo ?? 0;
              const isOptimo = stock > min;
              const isBajo = stock > 0 && stock <= min;
              const isAgotado = stock <= 0;

              let nivelLabel = 'ÓPTIMO';
              let nivelBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
              let barColor = 'bg-emerald-500';

              if (isAgotado) {
                nivelLabel = 'AGOTADO';
                nivelBadge = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25';
                barColor = 'bg-red-500';
              } else if (isBajo) {
                nivelLabel = 'BAJO';
                nivelBadge = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
                barColor = 'bg-amber-500';
              }

              const barWidth = min > 0 ? Math.min(100, Math.max(6, (stock / (min * 1.5)) * 100)) : stock > 0 ? 100 : 4;

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelectProducto(p)}
                  className="hover:bg-slate-900/5 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  {/* PRODUCTO */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-text group-hover:text-rose-500 transition-colors">
                      {p.nombre}
                    </div>
                    <div className="text-[11px] font-mono text-text-muted tracking-wider">
                      {p.sku}
                    </div>
                  </td>

                  {/* CATEGORÍA */}
                  <td className="py-3.5 px-4 text-text-muted">
                    {p.categoriaNombre ? (
                      p.categoriaNombre
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-white/5 text-text-muted">
                        Sin categoría
                      </span>
                    )}
                  </td>

                  {/* STOCK DE LA SEDE */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-text tabular-nums w-8">
                        {stock}
                      </span>
                      <div className="h-1.5 w-24 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* MÍNIMO */}
                  <td className="py-3.5 px-4 text-center font-mono text-text-muted tabular-nums">
                    {min}
                  </td>

                  {/* PRECIO */}
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-text tabular-nums">
                    {formatCOP(p.precioVenta)}
                  </td>

                  {/* NIVEL */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${nivelBadge}`}
                    >
                      {nivelLabel}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onVerKardex(p)}
                        className="px-2.5 py-1 rounded-lg border border-border superficie-control text-text-muted hover:text-text text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Kardex
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditarProducto(p)}
                        className="px-2.5 py-1 rounded-lg border border-border superficie-control text-text-muted hover:text-text text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => toggleMenu(p.id, e)}
                        aria-label={`Más acciones para ${p.nombre}`}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-border superficie-control text-text-muted hover:text-text transition-colors cursor-pointer"
                      >
                        <span className="text-base leading-none tracking-widest">…</span>
                      </button>

                      {/* Dropdown flotante */}
                      {openMenuId === p.id && (
                        <div
                          className="absolute right-0 top-8 w-48 rounded-xl bg-black border border-white/20 shadow-2xl py-1 z-30 text-left text-xs text-white"
                          onMouseLeave={() => setOpenMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onSelectProducto(p);
                            }}
                            className="w-full px-3.5 py-2 text-left text-white/80 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
                          >
                            Ver detalles en panel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onVerHistorialPrecios(p);
                            }}
                            className="w-full px-3.5 py-2 text-left text-white/80 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
                          >
                            Historial de precios
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onAjustarStockMinimo(p);
                            }}
                            className="w-full px-3.5 py-2 text-left text-white/80 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
                          >
                            Ajustar stock mínimo
                          </button>
                          <div className="my-1 border-t border-white/[0.15]" />
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onCambiarEstado(p, !p.isActive);
                            }}
                            className={`w-full px-3.5 py-2 text-left transition-colors cursor-pointer ${
                              p.isActive
                                ? 'text-red-400 hover:bg-red-500/20'
                                : 'text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {p.isActive ? 'Inactivar producto' : 'Activar producto'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil: Tarjetas apiladas */}
      <div className="md:hidden space-y-3">
        {productos.map((p) => {
          const stock = p.stockActual ?? 0;
          const min = p.stockMinimo ?? 0;
          const isAgotado = stock <= 0;
          const isBajo = stock > 0 && stock <= min;

          let nivelLabel = 'Óptimo';
          let nivelBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
          let barColor = 'bg-emerald-500';

          if (isAgotado) {
            nivelLabel = 'Agotado';
            nivelBadge = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25';
            barColor = 'bg-red-500';
          } else if (isBajo) {
            nivelLabel = 'Stock bajo';
            nivelBadge = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
            barColor = 'bg-amber-500';
          }

          const barWidth = min > 0 ? Math.min(100, Math.max(6, (stock / (min * 1.5)) * 100)) : stock > 0 ? 100 : 4;

          return (
            <div
              key={p.id}
              onClick={() => onSelectProducto(p)}
              className="vidrio rounded-2xl p-4 space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-text text-sm">{p.nombre}</div>
                  <div className="text-xs font-mono text-text-muted">{p.sku}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${nivelBadge}`}>
                  {nivelLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <div className="text-text-muted text-[10px] uppercase">Categoría</div>
                  <div className="text-text">{p.categoriaNombre || 'Sin categoría'}</div>
                </div>
                <div className="text-right">
                  <div className="text-text-muted text-[10px] uppercase">Precio venta</div>
                  <div className="font-mono font-medium text-text">{formatCOP(p.precioVenta)}</div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Stock sede: <strong className="text-text font-mono">{stock}</strong></span>
                  <span>Mínimo: <strong className="text-text font-mono">{min}</strong></span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full`} style={{ width: `${barWidth}%` }} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onVerKardex(p)}
                  className="px-3 py-1.5 rounded-xl border border-border superficie-control text-text text-xs"
                >
                  Kardex
                </button>
                <button
                  type="button"
                  onClick={() => onEditarProducto(p)}
                  className="px-3 py-1.5 rounded-xl border border-border superficie-control text-text text-xs"
                >
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
