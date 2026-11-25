'use client';

/**
 * AbonoCreditoDirectoModal.tsx — Modal administrativo para registrar un abono
 * directo sobre una obligación de crédito corporativo B2B.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { registrarAbonoCreditoSchema, type CreditoB2BDto } from '@inventa/contracts';
import { Modal } from '@/components/ui/Modal';
import { formatCOP } from '@/lib/format/moneda';
import { branchClientsService } from '../../api/branch-clients.service';

export interface AbonoCreditoDirectoModalProps {
  open: boolean;
  clienteIdInicial?: string;
  onClose: () => void;
  onAbonoRegistrado: () => void;
}

export function AbonoCreditoDirectoModal({
  open,
  clienteIdInicial,
  onClose,
  onAbonoRegistrado,
}: AbonoCreditoDirectoModalProps) {
  const [creditos, setCreditos] = useState<CreditoB2BDto[]>([]);
  const [creditoId, setCreditoId] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    setCargando(true);
    setError(null);
    branchClientsService
      .listarCarteraPendiente(clienteIdInicial)
      .then((res) => {
        if (cancelado) return;
        setCreditos(res.items);
        if (res.items.length > 0) {
          setCreditoId(res.items[0].id);
          setMonto(String(res.items[0].saldo));
        } else {
          setCreditoId('');
          setMonto('');
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : 'No fue posible cargar créditos pendientes.');
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, clienteIdInicial]);

  const creditoSeleccionado = creditos.find((c) => c.id === creditoId) ?? null;

  const handleSelectCredito = (id: string) => {
    setCreditoId(id);
    const encontrado = creditos.find((c) => c.id === id);
    if (encontrado) setMonto(String(encontrado.saldo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!creditoSeleccionado) {
      setError('Selecciona una obligación de crédito pendiente.');
      return;
    }

    const parsed = registrarAbonoCreditoSchema.safeParse({ monto });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Monto inválido.');
      return;
    }
    if (parsed.data.monto > creditoSeleccionado.saldo + 0.01) {
      setError(`El monto supera el saldo pendiente (${formatCOP(creditoSeleccionado.saldo)}).`);
      return;
    }

    setEnviando(true);
    try {
      await branchClientsService.registrarAbonoCredito(creditoSeleccionado.id, parsed.data);
      onAbonoRegistrado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el abono.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !enviando && onClose()}
      title="Registrar abono directo B2B"
      description="Descuenta saldo de la obligación y libera cupo corporativo al instante"
      size="md"
      locked={enviando}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="py-6 text-center text-text-muted">Cargando cartera pendiente...</div>
        ) : creditos.length === 0 ? (
          <div className="py-6 text-center text-text-muted">
            No hay obligaciones de crédito B2B con saldo pendiente en tu sucursal.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-text-muted font-medium mb-1">
                Obligación de crédito *
              </label>
              <select
                value={creditoId}
                onChange={(e) => handleSelectCredito(e.target.value)}
                className="w-full superficie-control rounded-xl px-3 py-2 text-text focus:outline-none cursor-pointer"
              >
                {creditos.map((c) => (
                  <option key={c.id} value={c.id} className="bg-bg text-text">
                    FAC-{String(c.facturaConsecutivo).padStart(4, '0')} · {c.clienteNombre} · Saldo {formatCOP(c.saldo)}
                  </option>
                ))}
              </select>
            </div>

            {creditoSeleccionado && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <span className="text-text-muted">Saldo actual de la obligación:</span>
                <span className="text-sm font-titulos font-semibold text-text tabular-nums">
                  {formatCOP(creditoSeleccionado.saldo)}
                </span>
              </div>
            )}

            <div>
              <label className="block text-text-muted font-medium mb-1">
                Monto del abono (COP) *
              </label>
              <input
                type="number"
                min={1}
                max={creditoSeleccionado?.saldo}
                step="100"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full superficie-control rounded-xl px-3 py-2 text-text tabular-nums focus:outline-none"
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            disabled={enviando}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-text-muted hover:text-text font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || creditos.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium disabled:opacity-50 cursor-pointer"
          >
            {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
            <span>{enviando ? 'Aplicando...' : 'Aplicar abono'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
