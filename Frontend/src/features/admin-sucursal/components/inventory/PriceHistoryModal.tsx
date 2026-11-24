'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
import { branchInventoryService } from '../../api/branch-inventory.service';
import type { ProductoInventarioSede, ItemHistorialPrecio } from '../../types/branch-inventory.types';

interface PriceHistoryModalProps {
  open: boolean;
  producto: ProductoInventarioSede | null;
  onClose: () => void;
}

export function PriceHistoryModal({ open, producto, onClose }: PriceHistoryModalProps) {
  const [historial, setHistorial] = useState<ItemHistorialPrecio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !producto) {
      setHistorial([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    branchInventoryService
      .consultarHistorialPrecios(producto.id)
      .then((items) => {
        setHistorial(items);
      })
      .catch((err: any) => {
        setError(err?.message || 'No fue posible cargar el historial de precios.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, producto]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Historial de cambios de precio"
      description={producto ? `${producto.nombre} (${producto.sku})` : undefined}
      size="lg"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-border superficie-control text-text-muted hover:text-text text-xs font-semibold cursor-pointer"
        >
          Cerrar
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3 py-6">
          <div className="h-6 bg-black/5 dark:bg-white/5 rounded animate-pulse w-full" />
          <div className="h-6 bg-black/5 dark:bg-white/5 rounded animate-pulse w-4/5" />
          <div className="h-6 bg-black/5 dark:bg-white/5 rounded animate-pulse w-2/3" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
          {error}
        </div>
      ) : historial.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-xs">
          <p className="font-medium text-text">Sin cambios de precio registrados</p>
          <p className="mt-1">
            Los precios no han sido modificados desde la creación de este producto.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Acción</th>
                <th className="py-2.5 px-3 text-right">Precio Venta</th>
                <th className="py-2.5 px-3 text-right">Precio Compra</th>
                <th className="py-2.5 px-3">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historial.map((item) => (
                <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 text-text-muted whitespace-nowrap">
                    {new Date(item.fecha).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-black/5 dark:bg-white/5 text-text border border-border">
                      {item.accion}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span className="text-text-muted line-through mr-1.5 opacity-60">
                      {item.precioVentaAnterior !== null ? formatCOP(item.precioVentaAnterior) : '-'}
                    </span>
                    <span className="font-bold text-amber-500 dark:text-amber-400">
                      {item.precioVentaNuevo !== null ? formatCOP(item.precioVentaNuevo) : '-'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-text">
                    <span className="text-text-muted line-through mr-1.5 opacity-60">
                      {item.precioCompraAnterior !== null ? formatCOP(item.precioCompraAnterior) : '-'}
                    </span>
                    <span>
                      {item.precioCompraNuevo !== null ? formatCOP(item.precioCompraNuevo) : '-'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-text-muted">
                    {item.usuarioNombre || (item.usuarioId ? `Usuario #${item.usuarioId}` : 'Sistema')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
