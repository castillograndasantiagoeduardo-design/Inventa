/**
 * BotonLanding.tsx — Enlace con aspecto de botón para la landing (componente "Botón" del diseño en Figma).
 *
 * - primario:   bg-brand-600 con sombra de marca (CTA principal).
 * - secundario: .superficie-control con borde translúcido.
 */

import Link from 'next/link';
import React from 'react';

export type VarianteBoton = 'primario' | 'secundario';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3 font-sans text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

const VARIANTES: Record<VarianteBoton, string> = {
  primario: 'bg-brand-600 text-btn-primario-texto shadow-lg shadow-brand-600/30 hover:bg-brand-500',
  secundario: 'superficie-control border border-border text-text hover:border-brand-500/40',
};

export function BotonLanding({
  href,
  variante = 'primario',
  className = '',
  children,
}: {
  href: string;
  variante?: VarianteBoton;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTES[variante]} ${className}`}>
      {children}
    </Link>
  );
}
