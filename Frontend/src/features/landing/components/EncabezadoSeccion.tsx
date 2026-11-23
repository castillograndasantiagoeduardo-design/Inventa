/**
 * EncabezadoSeccion.tsx — Etiqueta + título + descripción centrados de cada sección de la landing.
 */

import React from 'react';
import { EstrellaInventa } from '@/components/panel/EstrellaInventa';

export function EncabezadoSeccion({
  id,
  etiqueta,
  titulo,
  descripcion,
}: {
  id: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-brand-600 dark:text-brand-300">
        <EstrellaInventa />
        {etiqueta}
      </span>
      <h2 id={id} className="font-titulos font-semibold text-text text-3xl sm:text-[38px] sm:leading-[46px] tracking-[-0.005em]">
        {titulo}
      </h2>
      <p className="max-w-[680px] font-sans text-base sm:text-lg leading-[1.65] text-text-muted">{descripcion}</p>
    </div>
  );
}
