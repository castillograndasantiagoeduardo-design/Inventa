'use client';

/**
 * PosHeader.tsx — Barra superior de control de la Terminal POS de Inventa.
 *
 * Muestra la identidad de la sucursal, datos del cajero, estado de la caja
 * en tiempo real y accesos rápidos a alertas, historial y cierre de turno.
 */

import React, { useEffect, useState } from 'react';
import { Bell, Moon, Receipt, Sun } from 'lucide-react';
import { InventaLogo } from '@/components/panel/InventaLogo';
import { InventaWordmark } from '@/components/panel/InventaWordmark';
import { SelectorPaleta } from '@/components/SelectorPaleta';
import { AvatarMarca } from '@/features/marca';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { TurnoCajaDto } from '../types/pos.types';

interface PosHeaderProps {
  usuarioNombre: string;
  usuarioEmail: string;
  sucursalNombre: string;
  turno: TurnoCajaDto | null;
  onAbrirModalTurno: () => void;
  onAbrirModalAlerta: () => void;
  onAbrirHistorial: () => void;
  onLogout: () => void;
}

export function PosHeader({
  usuarioNombre,
  usuarioEmail,
  sucursalNombre,
  turno,
  onAbrirModalTurno,
  onAbrirModalAlerta,
  onAbrirHistorial,
  onLogout,
}: PosHeaderProps) {
  const tieneTurnoAbierto = Boolean(
    turno && (turno.estaAbierto === true || turno.fechaCierre === null),
  );

  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  const horaApertura = turno?.fechaApertura
    ? new Date(turno.fechaApertura).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const [modo, setModo] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setModo(document.documentElement.classList.contains('light') ? 'light' : 'dark');
  }, []);

  const alternarModo = () => {
    const nuevo = modo === 'dark' ? 'light' : 'dark';
    setModo(nuevo);
    const d = document.documentElement;
    d.classList.toggle('light', nuevo === 'light');
    d.classList.toggle('dark', nuevo === 'dark');
    try {
      localStorage.setItem(STORAGE_KEYS.tema, nuevo);
    } catch {}
  };

  return (
    <header className="h-16 px-4 vidrio-fuerte rounded-none border-x-0 border-t-0 flex items-center justify-between gap-3 select-none z-30">
      {/* Lado izquierdo: Marca, Logo corporativo y Sucursal */}
      <div className="flex items-center gap-3 min-w-0">
        <AvatarMarca className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
          <InventaLogo className="w-9 rounded-lg ring-1 ring-slate-900/10 dark:ring-white/20" />
        </AvatarMarca>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="flex items-baseline gap-1.5">
              <InventaWordmark className="text-lg text-text" />
              <span className="font-titulos font-bold text-brand-600 dark:text-brand-400 text-sm tracking-wider uppercase">
                POS
              </span>
            </h1>
            <span className="px-2 py-0.5 rounded-full superficie-control text-[10px] text-text font-medium truncate max-w-[140px]">
              {sucursalNombre || 'Sede Principal'}
            </span>
          </div>
          <p className="text-[11px] text-text-muted leading-none truncate">
            Operador: <span className="text-text font-medium">{usuarioNombre || usuarioEmail}</span>
          </p>
        </div>
      </div>

      {/* Centro: Estado del Turno de Caja */}
      <div className="flex items-center gap-3 shrink-0">
        {tieneTurnoAbierto ? (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl superficie-control border-emerald-500/35">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Caja Abierta
                </span>
                <span className="text-[10px] text-text-muted">desde {horaApertura}</span>
              </div>
              <p className="text-[10px] text-text-muted">
                Fondo base: <span className="text-text font-medium tabular-nums">{formatoCOP(turno?.fondoInicial || 0)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onAbrirModalTurno}
              className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-600 dark:text-red-300 text-[11px] font-semibold uppercase cursor-pointer transition-colors"
              title="Cerrar turno de caja y realizar arqueo"
            >
              Cerrar Turno
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wide hidden sm:inline">
              Turno No Iniciado
            </span>
            <button
              type="button"
              onClick={onAbrirModalTurno}
              className="btn-3d btn-3d-panel text-xs px-3 py-1 min-h-[32px]"
            >
              Abrir Turno
            </button>
          </div>
        )}
      </div>

      {/* Lado derecho: Apariencia (con slider de transparencia), Tema, Historial, Alertas y Salir */}
      <div className="flex items-center gap-2 shrink-0">
        <SelectorPaleta />

        <button
          type="button"
          onClick={alternarModo}
          className="superficie-control rounded-xl p-2 text-text-muted hover:text-text transition-colors cursor-pointer"
          title={modo === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Cambiar tema de color"
        >
          {modo === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-brand-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-brand-500" />
          )}
        </button>

        <button
          type="button"
          onClick={onAbrirHistorial}
          className="px-3 py-1.5 rounded-xl superficie-control text-text text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
          title="Historial de comprobantes emitidos en el turno [F8]"
        >
          <Receipt className="w-3.5 h-3.5 text-brand-500" />
          <span className="hidden xl:inline">Historial</span>
          <span className="text-[10px] text-text-muted font-mono hidden sm:inline">[F8]</span>
        </button>

        <button
          type="button"
          onClick={onAbrirModalAlerta}
          className="px-3 py-1.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
          title="Emitir alerta operativa al Administrador de Sucursal [F9]"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Alertar</span>
          <span className="text-[10px] opacity-70 font-mono hidden sm:inline">[F9]</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/12 text-xs font-medium cursor-pointer transition-colors"
          title="Cerrar sesión del cajero"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
