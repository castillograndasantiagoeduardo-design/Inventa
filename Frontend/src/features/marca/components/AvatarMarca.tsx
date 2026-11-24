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
  const { logoUrl } = useMarcaEmpresa();
  if (!logoUrl) return <div className={className}>{children}</div>;
  return (
    <div className={`${className} !bg-white/95 !text-transparent overflow-hidden p-0.5`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- URL de objeto del logo, no optimizable */}
      <img src={logoUrl} alt="Logo de la empresa" className="w-full h-full object-contain" />
    </div>
  );
}
