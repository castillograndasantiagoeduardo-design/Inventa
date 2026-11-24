'use client';

/**
 * ManualExitModal.tsx — Modal para registrar salidas manuales justificadas de inventario (RF-ADM-B8).
 * Migrado a Modal.tsx para accesibilidad y diseño unificado.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  ProductoInventarioSede,
  RegistrarSalidaDTO,
} from '../types/branch-inventory.types';

interface ManualExitModalProps {
  isOpen: boolean;
  sucursalId: number;
  productos: ProductoInventarioSede[];
  productoInicial?: ProductoInventarioSede | null;
  onClose: () => void;
  onRegistrar: (dto: RegistrarSalidaDTO) => Promise<{ ok: boolean; error?: string }>;
}

const MOTIVOS_TIPIFICADOS = [
  'Merma operativa por manipulación o transporte',
  'Avería / Producto con defecto de fábrica',
  'Rotura accidental en estantería o exhibición',
  'Fecha de caducidad / Vencimiento alcanzado',
  'Muestra técnica comercial o demostración',
  'Deterioro por condiciones ambientales',
  'Otro motivo justificado de baja',
];

export function ManualExitModal({
  isOpen,
  sucursalId,
  productos,
  productoInicial,
  onClose,
  onRegistrar,
}: ManualExitModalProps) {
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivoTipificado, setMotivoTipificado] = useState(MOTIVOS_TIPIFICADOS[0]);
  const [observacionDetallada, setObservacionDetallada] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productoInicial) {
        setProductoId(productoInicial.id);
      } else if (productos.length > 0) {
        setProductoId(productos[0].id);
      }
      setCantidad('');
      setObservacionDetallada('');
      setErrorMsg(null);
    }
  }, [isOpen, productoInicial, productos]);

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const stockDisponible = productoSeleccionado?.stockActual ?? 0;
  const cantNum = typeof cantidad === 'number' ? cantidad : 0;
  const esExcesiva = cantNum > stockDisponible;
  const saldoFinal = stockDisponible - cantNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productoId) {
      setErrorMsg('Debes seleccionar un producto.');
      return;
    }

    if (!cantidad || cantidad <= 0) {
      setErrorMsg('La cantidad a descargar debe ser mayor a 0.');
      return;
    }

    if (esExcesiva) {
      setErrorMsg(`No puedes descargar ${cantNum} unidades. La sede solo cuenta con ${stockDisponible}.`);
      return;
    }

    const motivoCompleto = observacionDetallada.trim()
      ? `${motivoTipificado}: ${observacionDetallada.trim()}`
      : motivoTipificado;

    setIsSubmitting(true);
    try {
      const res = await onRegistrar({
        sucursalId,
        productoId,
        cantidad: Number(cantidad),
        motivo: motivoCompleto,
      });

      if (res.ok) {
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible registrar la salida.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al registrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Registrar Salida de Inventario"
      description="Descargo por merma, avería, vencimiento o uso interno"
      size="md"
      locked={isSubmitting}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-border superficie-control text-text-muted hover:text-text text-xs font-semibold cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !cantidad || cantidad <= 0 || esExcesiva}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 shadow-lg shadow-red-500/20"
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar Salida'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1">
            Producto a descargar *
          </label>
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl superficie-control text-text text-xs focus:outline-none focus:border-red-500 cursor-pointer"
            required
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id} className="bg-black text-white">
                {p.nombre} ({p.sku}) — Stock: {p.stockActual ?? 0}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Cantidad a dar de baja *
            </label>
            <input
              type="number"
              min="1"
              max={stockDisponible}
              placeholder="Ej. 2"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className={`w-full h-10 px-3 rounded-xl superficie-control font-mono text-xs focus:outline-none ${
                esExcesiva ? 'border-red-500 text-red-500 dark:text-red-300' : 'text-text focus:border-red-500'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Tipo de justificación *
            </label>
            <select
              value={motivoTipificado}
              onChange={(e) => setMotivoTipificado(e.target.value)}
              className="w-full h-10 px-3 rounded-xl superficie-control text-text text-xs focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {MOTIVOS_TIPIFICADOS.map((m) => (
                <option key={m} value={m} className="bg-black text-white">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de saldo calculado */}
        {productoSeleccionado && (
          <div className="vidrio rounded-xl p-3 flex items-center justify-between text-xs border border-border">
            <span className="text-text-muted">Saldo resultante en sede:</span>
            <div className="font-mono">
              <span className="text-text-muted">{stockDisponible}</span>
              <span className="text-red-500 dark:text-red-400 font-bold mx-1.5">-{cantNum}</span>
              <span className={`font-bold text-sm ${esExcesiva ? 'text-red-500 dark:text-red-400' : 'text-text'}`}>
                ➔ {saldoFinal}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1">
            Detalle adicional / Observación
          </label>
          <textarea
            rows={2}
            placeholder="Ej. Número de acta de merma o lote dañado..."
            value={observacionDetallada}
            onChange={(e) => setObservacionDetallada(e.target.value)}
            className="w-full p-3 rounded-xl superficie-control text-text text-xs focus:outline-none focus:border-red-500 resize-none placeholder:text-text-muted"
          />
        </div>
      </form>
    </Modal>
  );
}
