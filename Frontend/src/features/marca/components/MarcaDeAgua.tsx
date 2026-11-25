'use client';

/**
 * MarcaDeAgua.tsx — Logo de la empresa muy tenue en el fondo de toda la página.
 * Va fijo detrás del contenido (-z-10, después de FondoAmbiental) y no recibe clics.
 */

import React from 'react';
import { useMarcaEmpresa } from '../hooks/useMarcaEmpresa';
import { calcularDimensionesMarcaAgua } from '../lib/normalizar-logo';

export function MarcaDeAgua({ className = '-z-10' }: { className?: string }) {
  const { logoUrl, proporcion, tonoLogo } = useMarcaEmpresa();
  if (!logoUrl) return null;

  const { ancho, alto } = calcularDimensionesMarcaAgua(proporcion);
  const claseTono =
    tonoLogo === 'oscuro'
      ? 'marca-agua-oscura'
      : tonoLogo === 'claro'
      ? 'marca-agua-clara'
      : '';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden flex items-center justify-center pt-16 pb-6 px-6 md:pl-64 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- URL de objeto del logo, no optimizable */}
      <img
        src={logoUrl}
        alt=""
        style={{ width: `${ancho}px`, height: `${alto}px` }}
        className={`marca-agua-img ${claseTono} object-contain select-none`}
      />
    </div>
  );
}
