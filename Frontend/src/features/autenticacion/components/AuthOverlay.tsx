'use client';

/**
 * AuthOverlay.tsx — Panel overlay deslizante para vista de escritorio con animaciones fluidas.
 *
 * Principio SOLID:
 * - Single Responsibility: Encapsula el fondo de marca, los brillos y las
 *   transiciones crossfade del panel deslizante de escritorio.
 */

import React from 'react';
import { EstrellaInventa } from '@/components/panel/EstrellaInventa';

interface AuthOverlayProps {
  isLogin: boolean;
  onToggleMode: () => void;
}

const BOTON_OVERLAY =
  'rounded-[10px] px-6 py-2.5 border border-white/50 text-white font-sans text-sm font-medium hover:bg-white hover:text-brand-700 hover:border-white transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

export function AuthOverlay({ isLogin, onToggleMode }: AuthOverlayProps) {
  return (
    <div
      className={`absolute top-0 bottom-0 left-0 w-1/2 z-20 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] will-change-transform ${
        isLogin ? 'shadow-[-8px_0_28px_rgba(0,0,0,0.35)]' : 'shadow-[8px_0_28px_rgba(0,0,0,0.35)]'
      }`}
      style={{ transform: isLogin ? 'translateX(100%)' : 'translateX(0%)' }}
    >
      {/* Brillos y retícula sutil del panel de marca */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div className="absolute -top-20 -right-16 size-64 rounded-full bg-ambar/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-luz-3/20 blur-3xl" />
        <div className="absolute inset-0 trama-malla opacity-40" />
      </div>

      {/* Contenido Dinámico del Overlay (Crossfade sincronizado) */}
      <div className="relative w-full h-full flex items-center justify-center p-8 text-center z-10">
        {/* Overlay cuando estamos en LOGIN (Invita a Crear Cuenta) */}
        <div
          className={`max-w-[280px] flex flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
            isLogin ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'
          }`}
        >
          <EstrellaInventa className="size-5 mb-3" />
          <h2 className="font-titulos text-[28px] leading-9 font-semibold tracking-[-0.005em] text-white mb-2">
            ¡Hola, <span className="text-ambar">amigo!</span>
          </h2>
          <p className="font-sans text-sm text-white/80 leading-relaxed mb-6">
            Ingresa tus credenciales institucionales o solicita el alta de tu usuario para acceder a tus módulos y sucursales.
          </p>
          <button type="button" onClick={onToggleMode} className={BOTON_OVERLAY}>
            Crear cuenta
          </button>
        </div>

        {/* Overlay cuando estamos en REGISTRO (Invita a Iniciar Sesión) */}
        <div
          className={`max-w-[280px] flex flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
            !isLogin ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'
          }`}
        >
          <EstrellaInventa className="size-5 mb-3" />
          <h2 className="font-titulos text-[28px] leading-9 font-semibold tracking-[-0.005em] text-white mb-2">
            ¡Bienvenido de <span className="text-ambar">nuevo!</span>
          </h2>
          <p className="font-sans text-sm text-white/80 leading-relaxed mb-6">
            Para mantenerte conectado con tus inventarios, turnos de caja y ventas, inicia sesión con tu correo asignado.
          </p>
          <button type="button" onClick={onToggleMode} className={BOTON_OVERLAY}>
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
