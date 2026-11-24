'use client';

/**
 * VoidInvoiceModal.tsx — Modal para anulación administrativa de facturas (RF-FMC-E10).
 * 
 * Reutiliza el diálogo accesible `<Modal>` de `@/components/ui/Modal`
 * advirtiendo y ejecutando la reposición atómica de stock en el kardex de la sede.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { FacturaSede } from '../types/branch-invoicing.types';

interface VoidInvoiceModalProps {
  isOpen: boolean;
  factura: FacturaSede | null;
  onClose: () => void;
  onAnular: (id: string, motivo: string) => Promise<{ ok: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function VoidInvoiceModal({
  isOpen,
  factura,
  onClose,
  onAnular,
  onSuccess,
}: VoidInvoiceModalProps) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !factura) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const motivoTrimmed = motivo.trim();
    if (motivoTrimmed.length < 5) {
      setErrorMsg('El motivo de anulación es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAnular(factura.id, motivoTrimmed);
      if (!res.ok) {
        setErrorMsg(res.error || 'No fue posible anular la factura.');
        return;
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al anular la factura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Anular factura ${factura.folioFormateado}`}
      description="Operación administrativa irreversible con reversión automática de existencias"
      size="md"
      locked={isSubmitting}
      footer={
        <div className="flex w-full items-center justify-end gap-2">
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
            disabled={isSubmitting || motivo.trim().length < 5}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-40"
          >
            {isSubmitting ? 'Anulando...' : 'Confirmar anulación'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Resumen de la Factura */}
        <div className="vidrio rounded-xl p-4 border border-border space-y-2 text-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span>Cliente</span>
            <span className="font-semibold text-text">
              {factura.clienteNombre} ({factura.clienteDocumento})
            </span>
          </div>
          <div className="flex justify-between items-center text-text-muted">
            <span>Fecha de emisión</span>
            <span className="font-mono text-text">{factura.fechaFormateada}</span>
          </div>
          <div className="flex justify-between items-center text-text-muted">
            <span>Monto total</span>
            <span className="font-mono font-bold text-text text-sm">
              {factura.totalFormateado}
            </span>
          </div>
          <div className="flex justify-between items-center text-text-muted">
            <span>Productos vendidos</span>
            <span className="font-mono text-text">{factura.items.length} ítem(s)</span>
          </div>
        </div>

        {/* Advertencia de Reposición de Stock (RF-FMC-E10) */}
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-rose-600 dark:text-rose-300">
            <span aria-hidden="true">⚠️</span>
            <span>Impacto en inventario y Kardex</span>
          </p>
          <p className="text-[11px] leading-relaxed text-text-muted">
            Al confirmar esta anulación, las cantidades de los productos facturados serán{' '}
            <strong className="text-text">reintegradas automáticamente al stock físico de la sucursal</strong>{' '}
            con un movimiento de reversión en el Kardex.
          </p>
        </div>

        {/* Motivo Obligatorio */}
        <div>
          <label htmlFor="void-reason" className="block text-xs font-medium text-text-muted mb-1">
            Motivo de la anulación <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="void-reason"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Error en medio de pago / Devolución total por cliente..."
            maxLength={255}
            className="w-full p-3 rounded-xl superficie-control border border-border text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-rose-500 resize-none"
            required
          />
          <div className="flex justify-between text-[10px] text-text-muted mt-1 font-mono">
            <span>Mínimo 5 caracteres</span>
            <span>{motivo.length} / 255</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
