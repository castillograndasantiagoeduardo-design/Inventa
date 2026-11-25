'use client';

/**
 * AvatarMarca.tsx — Avatar del perfil: muestra el logo de la empresa y, si no hay,
 * el contenido por defecto (normalmente las iniciales del usuario).
 */

import React from 'react';
import { useMarcaEmpresa } from '../hooks/useMarcaEmpresa';

interface AvatarMarcaProps {
  /** Clases del contenedor (tamaño y forma). */
  className: string;
  /** Lo que se ve si la empresa no tiene logo. */
  children: React.ReactNode;
}

export function AvatarMarca({ className, children }: AvatarMarcaProps) {
  const { logoUrl, proporcion, tonoLogo } = useMarcaEmpresa();
  if (!logoUrl) return <div className={className}>{children}</div>;

  const esPanoramico = proporcion > 1.45;
  const fondoAvatar =
    tonoLogo === 'claro'
      ? '!bg-slate-900 ring-white/20'
      : '!bg-white ring-slate-900/12 dark:ring-white/25';

  return (
    <div
      className={`${className} ${fondoAvatar} ${
        esPanoramico ? '!w-auto min-w-8 max-w-[74px] px-1.5' : 'p-1'
      } !text-transparent ring-1 shadow-sm overflow-hidden`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- URL de objeto del logo, no optimizable */}
      <img
        src={logoUrl}
        alt="Logo de la empresa"
        className="w-full h-full object-contain contrast-[1.05] saturate-[1.06]"
      />
    </div>
  );
}
