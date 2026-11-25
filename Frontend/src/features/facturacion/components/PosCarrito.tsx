'use client';

/**
 * PosCarrito.tsx — Panel de carrito y resumen de la orden de venta activa del POS.
 */

import React from 'react';
import type { ItemCarritoPos, ClienteDto } from '../types/pos.types';

interface PosCarritoProps {
  items: ItemCarritoPos[];
  totales: {
    subtotal: number;
    iva: number;
    total: number;
    cantidadItems: number;
    tieneItems: boolean;
  };
  /** null hasta que el cajero busque o cree el cliente de la venta. */
  cliente: ClienteDto | null;
  tieneTurnoAbierto: boolean;
  onActualizarCantidad: (productoId: string, cantidad: number) => void;
  onEliminarItem: (productoId: string) => void;
  onLimpiarCarrito: () => void;
  onAbrirModalCliente: () => void;
  onIniciarCobro: () => void;
}

export function PosCarrito({
  items,
  totales,
  cliente,
  tieneTurnoAbierto,
  onActualizarCantidad,
  onEliminarItem,
  onLimpiarCarrito,
  onAbrirModalCliente,
  onIniciarCobro,
}: PosCarritoProps) {
  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  return (
    <aside className="w-96 flex flex-col h-full vidrio-fuerte rounded-none border-y-0 border-r-0 select-none z-20">
      {/* 1. Selector de Cliente */}
      <div className="p-3.5 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
            Cliente Asignado
          </span>
          <button
            type="button"
            onClick={onAbrirModalCliente}
            className="text-[11px] font-medium text-brand-600 dark:text-brand-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Cambiar / Crear</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="p-2.5 rounded-xl superficie-control flex items-center justify-between">
          {cliente ? (
            <div className="truncate mr-2">
              <h5 className="text-xs font-semibold text-text truncate">
                {cliente.nombreRazonSocial}
              </h5>
              <p className="text-[11px] text-text-muted font-mono">
                {cliente.tipoDocumento}: {cliente.numeroDocumento}
                {cliente.tipoCliente === 'B2B' && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-300 text-[9px] font-bold">
                    B2B
                  </span>
                )}
              </p>
            </div>
          ) : (
            <button type="button" onClick={onAbrirModalCliente} className="truncate mr-2 text-left cursor-pointer">
              <h5 className="text-xs font-semibold text-amber-600 dark:text-amber-300">Sin cliente seleccionado</h5>
              <p className="text-[11px] text-text-muted">Busca o registra el cliente para poder cobrar</p>
            </button>
          )}
          <span className="w-7 h-7 rounded-lg superficie-control flex items-center justify-center text-xs shrink-0">
            👤
          </span>
        </div>
      </div>

      {/* 2. Lista de Ítems en Carrito */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <div className="flex items-center justify-between text-xs text-text-muted pb-1 border-b border-border">
          <span>Detalle de Artículos ({totales.cantidadItems})</span>
          {totales.tieneItems && (
            <button
              type="button"
              onClick={onLimpiarCarrito}
              className="text-[10px] text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              Vaciar Ticket
            </button>
          )}
        </div>

        {!totales.tieneItems ? (
          <div className="h-48 flex flex-col items-center justify-center text-text-muted text-center">
            <span className="text-3xl mb-1.5 opacity-60">🛒</span>
            <p className="text-xs font-medium text-text">Ticket de venta vacío</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Escanea o haz clic en los productos para agregarlos.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productoId}
              className="p-2.5 rounded-xl vidrio hover:translate-y-0 flex flex-col gap-1.5"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="truncate">
                  <h6 className="text-xs font-medium text-text truncate leading-tight">
                    {item.nombre}
                  </h6>
                  <span className="text-[10px] text-text-muted font-mono">{item.sku}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onEliminarItem(item.productoId)}
                  className="text-text-muted hover:text-red-500 text-xs px-1 cursor-pointer"
                  title="Eliminar de la orden"
                >
                  &times;
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                {/* Controles de cantidad */}
                <div className="flex items-center gap-1 superficie-control rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => onActualizarCantidad(item.productoId, item.cantidad - 1)}
                    className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/10 text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-xs text-text tabular-nums">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => onActualizarCantidad(item.productoId, item.cantidad + 1)}
                    className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/10 text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal del ítem */}
                <div className="text-right">
                  <span className="text-[10px] text-text-muted block leading-none tabular-nums">
                    {formatoCOP(item.precioUnitario)} c/u
                  </span>
                  <span className="font-titulos font-bold text-brand-600 dark:text-brand-300 text-sm tabular-nums">
                    {formatoCOP(item.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Panel Inferior: Totales y Botón de Cobro */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal</span>
            <span className="font-medium text-text tabular-nums">{formatoCOP(totales.subtotal)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>IVA</span>
            <span className="font-medium text-text tabular-nums">{formatoCOP(totales.iva)}</span>
          </div>
        </div>

        {/* Caja de Total Monumental */}
        <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/35 flex items-baseline justify-between">
          <span className="text-xs uppercase font-semibold text-text-muted tracking-wider">
            Total a Pagar
          </span>
          <span className="font-titulos font-bold text-3xl text-brand-600 dark:text-brand-300 tabular-nums leading-none">
            {formatoCOP(totales.total)}
          </span>
        </div>

        {/* Botón 3D de Cobro */}
        <button
          type="button"
          onClick={onIniciarCobro}
          disabled={!totales.tieneItems || !tieneTurnoAbierto || !cliente}
          className={`w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            !tieneTurnoAbierto
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 cursor-not-allowed'
              : !totales.tieneItems || !cliente
              ? 'superficie-control text-text-muted opacity-60 cursor-not-allowed'
              : 'btn-3d btn-3d-panel'
          }`}
        >
          <span>💳</span>
          <span>{!tieneTurnoAbierto ? 'Abre Turno para Cobrar' : !cliente ? 'Selecciona un Cliente' : 'Cobrar Orden (F4)'}</span>
        </button>
      </div>
    </aside>
  );
}
