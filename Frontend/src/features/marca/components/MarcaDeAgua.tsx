'use client';

/**
 * MarcaDeAgua.tsx — Logo de la empresa muy tenue en el fondo de toda la página.
 * Va fijo detrás del contenido (-z-10, después de FondoAmbiental) y no recibe clics.
 */

import React from 'react';
import { useMarcaEmpresa } from '../hooks/useMarcaEmpresa';

export function MarcaDeAgua({ className = '-z-10' }: { className?: string }) {
  const { logoUrl } = useMarcaEmpresa();
  if (!logoUrl) return null;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 flex items-center justify-center md:pl-56 ${className}`}
    >
      <div className="relative flex items-center justify-center w-[min(68vmin,580px)] h-[min(68vmin,580px)]">
        {/* Halo radial neutro detrás del PNG para separarlo de los orbes y del fondo oscuro/claro */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.18)_46%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_46%,transparent_72%)]" />
        {/* eslint-disable-next-line @next/next/no-img-element -- URL de objeto del logo, no optimizable */}
        <img
          src={logoUrl}
          alt=""
          className="relative w-[min(56vmin,470px)] h-[min(56vmin,470px)] object-contain opacity-[0.27] dark:opacity-[0.32] contrast-105 saturate-110 [filter:drop-shadow(0_0_2px_rgba(255,255,255,0.65))_drop-shadow(0_6px_18px_rgba(15,23,42,0.12))] dark:[filter:drop-shadow(0_0_2px_rgba(255,255,255,0.50))_drop-shadow(0_0_20px_rgba(255,255,255,0.16))] select-none"
        />
      </div>
    </div>
  );
}
