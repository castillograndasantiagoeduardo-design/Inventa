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
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- URL de objeto del logo, no optimizable */}
      <img
        src={logoUrl}
        alt=""
        className="w-[min(60vmin,520px)] h-[min(60vmin,520px)] object-contain opacity-[0.06] dark:opacity-[0.07] grayscale-[15%] select-none"
      />
    </div>
  );
}
