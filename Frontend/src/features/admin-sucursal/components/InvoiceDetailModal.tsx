'use client';

/**
 * InvoiceDetailModal.tsx — Comprobante detallado de factura y medios de pago (RF-FMC-E8).
 * 
 * Reutiliza el diálogo accesible `<Modal>` de `@/components/ui/Modal`
 * y consume `GET /ventas/facturas/:id` para traer datos en tiempo real.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
import { branchInvoicingService } from '../api/branch-invoicing.service';
import type { FacturaSede } from '../types/branch-invoicing.types';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  facturaId: string | null;
  onClose: () => void;
  onAnularClick: (factura: FacturaSede) => void;
  onDevolucionClick: (factura: FacturaSede) => void;
}

export function InvoiceDetailModal({
  isOpen,
  facturaId,
  onClose,
  onAnularClick,
  onDevolucionClick,
}: InvoiceDetailModalProps) {
  const [factura, setFactura] = useState<FacturaSede | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !facturaId) {
      setFactura(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    branchInvoicingService
      .obtenerFacturaPorId(facturaId)
      .then((data) => {
        if (isMounted) setFactura(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Error al cargar los detalles de la factura.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, facturaId]);

  // Calcula si quedan unidades por devolver
  const tieneUnidadesDevolvibles = useMemo(() => {
    if (!factura || factura.estado === 'anulada') return false;
    const devueltosPorItem = new Map<string, number>();
    for (const dev of factura.devoluciones || []) {
      const prev = devueltosPorItem.get(dev.facturaItemId) ?? 0;
      devueltosPorItem.set(dev.facturaItemId, prev + dev.cantidad);
    }

    return factura.items.some((it) => {
      const yaDevuelto = devueltosPorItem.get(it.id) ?? 0;
      return it.cantidad - yaDevuelto > 0;
    });
  }, [factura]);

  const esAnulada = factura?.estado === 'anulada';

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={factura ? `Comprobante ${factura.folioFormateado}` : 'Detalle de factura'}
      description={factura ? `Emisión: ${factura.fechaFormateada}` : undefined}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {factura && !esAnulada && (
              <button
                type="button"
                onClick={() => onAnularClick(factura)}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold cursor-pointer border border-red-500/20 transition-colors"
              >
                Anular factura
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border superficie-control text-text-muted hover:text-text transition-colors text-xs font-semibold cursor-pointer"
            >
              Cerrar
            </button>

            {factura && !esAnulada && tieneUnidadesDevolvibles && (
              <button
                type="button"
                onClick={() => onDevolucionClick(factura)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Registrar devolución
              </button>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          <p className="text-xs">Consultando comprobante en el servidor...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-300 text-xs">
          {error}
        </div>
      ) : factura ? (
        <div className="space-y-4 text-xs">
          {/* Banner de Estado Anulada */}
          {esAnulada && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-300 text-xs flex items-center gap-2.5">
              <span className="text-base" aria-hidden="true">🚫</span>
              <div>
                <p className="font-semibold text-text">Factura anulada administrativamente</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  El importe total fue revertido y las unidades de stock fueron restituidas al Kardex de la sede.
                </p>
              </div>
            </div>
          )}

          {/* Información general: Cliente, Cajero, Estado y Canal */}
          <div className="vidrio rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border border-border">
            <div>
              <span className="text-text-muted block">Cliente / Titular</span>
              <span className="text-text font-semibold text-sm block mt-0.5">
                {factura.clienteNombre || 'Consumidor Final'}
              </span>
              <span className="text-text-muted font-mono text-[11px]">
                Doc: {factura.clienteDocumento || '222222222222'}
              </span>
            </div>

            <div>
              <span className="text-text-muted block">Cajero / Operador</span>
              <span className="text-text font-semibold text-sm block mt-0.5">
                {factura.cajeroNombre || 'Cajero de turno'}
              </span>
              <span className="text-text-muted font-mono text-[11px]">
                {factura.turnoCajaId ? `Turno #${factura.turnoCajaId.slice(0, 8)}` : 'Venta B2B directa'}
              </span>
            </div>

            <div>
              <span className="text-text-muted block">Estado</span>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                  esAnulada
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                }`}
              >
                {esAnulada ? 'Anulada' : 'Emitida · Válida'}
              </span>
            </div>

            <div>
              <span className="text-text-muted block">Tipo de venta</span>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                  factura.tipoVenta === 'B2B'
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                }`}
              >
                {factura.tipoVenta || 'POS'}
              </span>
            </div>
          </div>

          {/* Tabla de Productos Facturados */}
          <div className="vidrio rounded-xl p-4 space-y-2.5 border border-border">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Productos y servicios facturados
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border superficie-control text-text-muted text-[10px] uppercase font-mono">
                    <th scope="col" className="py-2.5 px-3">Producto / Descripción</th>
                    <th scope="col" className="py-2.5 px-3 text-center">Cant.</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Precio Unit.</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {factura.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-900/5 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-text block">{it.productoNombre}</span>
                        <span className="text-[10px] text-text-muted font-mono">ID: {it.productoId.slice(0, 8)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-text">
                        {it.cantidad}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-muted">
                        {formatCOP(it.precioUnitario)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                        {formatCOP(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medios de Pago y Totales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="vidrio rounded-xl p-4 border border-border space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                Medios de pago asentados
              </span>
              <div className="space-y-1.5 pt-1">
                {factura.pagos.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <span className="capitalize text-text-muted font-medium">
                      {p.medioPago.replace('_', ' ')}
                    </span>
                    <span className="font-mono font-bold text-text">{formatCOP(p.monto)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="vidrio rounded-xl p-4 border border-border space-y-2 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal neto</span>
                <span className="font-mono text-text">{formatCOP(factura.subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>IVA (0% / 19%)</span>
                <span className="font-mono text-text">{formatCOP(factura.iva)}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm font-bold pt-2 border-t border-border text-text">
                <span>Total facturado</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  {factura.totalFormateado}
                </span>
              </div>
            </div>
          </div>

          {/* Sección de Devoluciones Asociadas */}
          {factura.devoluciones && factura.devoluciones.length > 0 && (
            <div className="vidrio rounded-xl p-4 border border-border space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Devoluciones registradas ({factura.devoluciones.length})
              </div>
              <div className="space-y-2">
                {factura.devoluciones.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3 rounded-xl superficie-control border border-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-text-muted">{dev.fechaFormateada}</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        Reembolso: {dev.montoReembolsoFormateado}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-text text-[11px]">
                      <span>Cantidad: {dev.cantidad} unidad(es)</span>
                      <span>Stock reingresado: {dev.reingresaStock ? 'Sí' : 'No'}</span>
                    </div>
                    <p className="text-text-muted text-[11px]">Motivo: {dev.motivo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
