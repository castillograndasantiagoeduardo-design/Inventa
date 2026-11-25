'use client';

/**
 * ReturnInvoiceModal.tsx — Modal para registro de devoluciones totales o parciales (RF-FMC-E8 / RF-FMC-E10).
 *
 * Construido estrictamente sobre el contrato POST /ventas/facturas/:id/devoluciones:
 * { motivo, reingresaStock, devolverTodo, items: [{ facturaItemId, cantidad }] }
 * Reutiliza el diálogo accesible `<Modal>` de `@/components/ui/Modal`.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
import type {
  FacturaSede,
  RegistrarDevolucionPayload,
} from '../types/branch-invoicing.types';

interface ReturnInvoiceModalProps {
  open: boolean;
  factura: FacturaSede | null;
  onClose: () => void;
  onRegistrarDevolucion: (
    id: string,
    payload: RegistrarDevolucionPayload,
  ) => Promise<{ ok: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function ReturnInvoiceModal({
  open,
  factura,
  onClose,
  onRegistrarDevolucion,
  onSuccess,
}: ReturnInvoiceModalProps) {
  const [motivo, setMotivo] = useState('');
  const [reingresaStock, setReingresaStock] = useState(true);
  const [devolverTodo, setDevolverTodo] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mapear lo ya devuelto por línea de factura
  const yaDevueltoMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!factura) return map;
    for (const dev of factura.devoluciones || []) {
      const prev = map.get(dev.facturaItemId) ?? 0;
      map.set(dev.facturaItemId, prev + dev.cantidad);
    }
    return map;
  }, [factura]);

  // Inicializar o resetear estado al abrir
  useEffect(() => {
    if (open) {
      setMotivo('');
      setReingresaStock(true);
      setDevolverTodo(false);
      setCantidades({});
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [open]);

  // Lista de items con su remanente
  const itemsConRemanente = useMemo(() => {
    if (!factura) return [];
    return factura.items.map((it) => {
      const yaDevuelto = yaDevueltoMap.get(it.id) ?? 0;
      const disponible = Math.max(0, it.cantidad - yaDevuelto);
      return {
        ...it,
        yaDevuelto,
        disponible,
      };
    });
  }, [factura, yaDevueltoMap]);

  // Cálculo de vista previa de reembolso estimado
  const totalReembolsoEstimado = useMemo(() => {
    if (!factura) return 0;
    let suma = 0;
    for (const it of itemsConRemanente) {
      const cant = devolverTodo ? it.disponible : (cantidades[it.id] || 0);
      if (cant > 0) {
        const descUnitario = it.cantidad > 0 ? it.descuento / it.cantidad : 0;
        suma += (it.precioUnitario - descUnitario) * cant;
      }
    }
    return Math.round(suma * 100) / 100;
  }, [factura, itemsConRemanente, devolverTodo, cantidades]);

  if (!open || !factura) return null;

  const handleCantidadChange = (itemId: string, valor: number, max: number) => {
    const limpia = Math.max(0, Math.min(Math.floor(valor || 0), max));
    setCantidades((prev) => ({
      ...prev,
      [itemId]: limpia,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const motivoTrimmed = motivo.trim();
    if (motivoTrimmed.length < 5) {
      setErrorMsg('El motivo de la devolución es obligatorio (mínimo 5 caracteres).');
      return;
    }

    const itemsPayload = Object.entries(cantidades)
      .filter(([_, cant]) => cant > 0)
      .map(([facturaItemId, cantidad]) => ({ facturaItemId, cantidad }));

    if (!devolverTodo && itemsPayload.length === 0) {
      setErrorMsg('Selecciona al menos una unidad a devolver o marca devolución total.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: RegistrarDevolucionPayload = {
        motivo: motivoTrimmed,
        reingresaStock,
        devolverTodo,
        items: devolverTodo ? [] : itemsPayload,
      };

      const res = await onRegistrarDevolucion(factura.id, payload);
      if (!res.ok) {
        setErrorMsg(res.error || 'No fue posible registrar la devolución.');
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al registrar la devolución.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hayItemsDevolvibles = itemsConRemanente.some((it) => it.disponible > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Registrar devolución — ${factura.folioFormateado}`}
      description="Registra la devolución total o parcial de productos con cálculo de reembolso y reingreso a Kardex"
      size="lg"
      locked={isSubmitting}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-text-muted">Reembolso estimado: </span>
            <span className="font-mono font-bold text-text text-sm">
              {formatCOP(totalReembolsoEstimado)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-border superficie-control text-text-muted hover:text-text transition-colors text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                motivo.trim().length < 5 ||
                (!devolverTodo && totalReembolsoEstimado <= 0) ||
                !hayItemsDevolvibles
              }
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar devolución'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {!hayItemsDevolvibles ? (
          <div className="p-4 rounded-xl superficie-control border border-border text-text-muted text-xs text-center">
            Esta factura ya no tiene unidades disponibles para devolver.
          </div>
        ) : (
          <>
            {/* Opciones Generales */}
            <div className="p-3.5 rounded-xl vidrio border border-border flex flex-wrap items-center justify-between gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={devolverTodo}
                  onChange={(e) => setDevolverTodo(e.target.checked)}
                  className="rounded border-border bg-transparent text-rose-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
                <span className="font-semibold text-text">Devolución total de la factura</span>
                <span className="text-[11px] text-text-muted">(Devuelve todo el remanente disponible)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reingresaStock}
                  onChange={(e) => setReingresaStock(e.target.checked)}
                  className="rounded border-border bg-transparent text-rose-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
                <span className="text-text">Reingresar stock al inventario</span>
              </label>
            </div>

            {/* Tabla de Selección de Ítems */}
            <div className="vidrio rounded-xl p-4 border border-border space-y-2.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Selección de unidades por producto
              </span>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border superficie-control text-text-muted text-[10px] uppercase font-mono">
                      <th scope="col" className="py-2.5 px-3">Producto</th>
                      <th scope="col" className="py-2.5 px-3 text-center">Facturado</th>
                      <th scope="col" className="py-2.5 px-3 text-center">Ya Devuelto</th>
                      <th scope="col" className="py-2.5 px-3 text-center">Disponible</th>
                      <th scope="col" className="py-2.5 px-3 text-right">Cant. a Devolver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {itemsConRemanente.map((it) => {
                      const cantActual = devolverTodo ? it.disponible : (cantidades[it.id] || 0);
                      return (
                        <tr key={it.id} className="hover:bg-slate-900/5 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-text block">{it.productoNombre}</span>
                            <span className="text-[10px] text-text-muted font-mono">
                              Unitario: {formatCOP(it.precioUnitario)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-text-muted">
                            {it.cantidad}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-text-muted">
                            {it.yaDevuelto}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {it.disponible}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {devolverTodo ? (
                              <span className="font-mono font-bold text-text">
                                {it.disponible}
                              </span>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={it.disponible}
                                disabled={it.disponible === 0}
                                value={cantActual || ''}
                                placeholder="0"
                                onChange={(e) =>
                                  handleCantidadChange(
                                    it.id,
                                    parseInt(e.target.value, 10) || 0,
                                    it.disponible,
                                  )
                                }
                                aria-label={`Cantidad a devolver para ${it.productoNombre}`}
                                className="w-20 px-2 py-1 rounded-lg superficie-control border border-border text-right font-mono text-xs text-text focus:outline-none focus:border-rose-500 disabled:opacity-30"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Motivo Obligatorio */}
            <div>
              <label htmlFor="return-reason" className="block text-xs font-medium text-text-muted mb-1">
                Motivo de la devolución <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="return-reason"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Producto defectuoso / Error de digitación en caja / Cambio solicitado por cliente..."
                maxLength={255}
                className="w-full p-3 rounded-xl superficie-control border border-border text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-rose-500 resize-none"
                required
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1 font-mono">
                <span>Mínimo 5 caracteres</span>
                <span>{motivo.length} / 255</span>
              </div>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
