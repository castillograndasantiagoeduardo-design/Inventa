'use client';

/**
 * AvisarPagoModal.tsx — Modal "Avisar pago" del Vendedor B2B.
 * Reporta un comprobante o referencia de pago sin alterar el saldo del crédito
 * hasta que Administración de Sucursal confirme o rechace el aviso.
 */

import React, { useEffect, useState } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { avisarPagoCreditoSchema } from '@inventa/contracts';
import { formatCOP } from '@/lib/format/moneda';
import type { AvisarPagoInput, CreditoB2BDto } from '../types';
import { ModalVidrio } from './ModalVidrio';

export interface AvisarPagoModalProps {
  open: boolean;
  credito: CreditoB2BDto | null;
  onClose: () => void;
  onSubmit: (creditoId: string, payload: AvisarPagoInput) => Promise<void>;
}

export function AvisarPagoModal({
  open,
  credito,
  onClose,
  onSubmit,
}: AvisarPagoModalProps) {
  const [monto, setMonto] = useState<string>('');
  const [referencia, setReferencia] = useState<string>('');
  const [nota, setNota] = useState<string>('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open && credito) {
      setMonto(String(credito.saldo));
      setReferencia('');
      setNota('');
      setErrores({});
      setErrorGeneral(null);
    }
  }, [open, credito]);

  if (!credito) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});
    setErrorGeneral(null);

    const parsed = avisarPagoCreditoSchema.safeParse({
      monto,
      referencia,
      nota,
    });

    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'general');
        if (!map[key]) map[key] = issue.message;
      }
      setErrores(map);
      return;
    }

    if (parsed.data.monto > credito.saldo + 0.01) {
      setErrores({
        monto: `El monto no puede superar el saldo pendiente (${formatCOP(credito.saldo)}).`,
      });
      return;
    }

    setEnviando(true);
    try {
      await onSubmit(credito.id, parsed.data);
      onClose();
    } catch (err) {
      setErrorGeneral(
        err instanceof Error ? err.message : 'No fue posible enviar el aviso de pago.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalVidrio
      open={open}
      onClose={onClose}
      locked={enviando}
      title="Avisar pago de crédito"
      description={`${credito.clienteNombre} · FAC-${String(credito.facturaConsecutivo).padStart(4, '0')}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {errorGeneral && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300">
            {errorGeneral}
          </div>
        )}

        <div className="vidrio p-3.5 rounded-xl flex items-center justify-between">
          <span className="text-text-muted font-medium">Saldo pendiente actual:</span>
          <span className="text-base font-titulos font-semibold text-text tabular-nums">
            {formatCOP(credito.saldo)}
          </span>
        </div>

        <div>
          <label className="block text-text-muted font-medium mb-1">
            Monto reportado (COP) *
          </label>
          <input
            type="number"
            min={1}
            max={credito.saldo}
            step="100"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full superficie-control rounded-xl px-3 py-2 text-text tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          {errores.monto && <p className="text-[11px] text-red-400 mt-1">{errores.monto}</p>}
        </div>

        <div>
          <label className="block text-text-muted font-medium mb-1">
            Referencia bancaria / comprobante *
          </label>
          <input
            type="text"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej. TRF-BANCOLOMBIA-90821"
            className="w-full superficie-control rounded-xl px-3 py-2 font-mono text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          {errores.referencia && (
            <p className="text-[11px] text-red-400 mt-1">{errores.referencia}</p>
          )}
        </div>

        <div>
          <label className="block text-text-muted font-medium mb-1">Nota opcional</label>
          <textarea
            rows={2}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Banco origen, fecha de transferencia o comentario para administración..."
            className="w-full superficie-control rounded-xl px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          {errores.nota && <p className="text-[11px] text-red-400 mt-1">{errores.nota}</p>}
        </div>

        <p className="text-[11px] text-text-muted leading-relaxed">
          El saldo del crédito no cambia hasta que el Administrador de Sucursal verifique el ingreso y confirme este aviso.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="px-4 py-2 rounded-xl superficie-control text-text-muted hover:text-text font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium disabled:opacity-50 cursor-pointer"
          >
            {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
            <span>{enviando ? 'Enviando...' : 'Enviar aviso de pago'}</span>
          </button>
        </div>
      </form>
    </ModalVidrio>
  );
}
