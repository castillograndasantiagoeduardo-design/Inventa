/**
 * ModulosSection.tsx — Cuadrícula de módulos del sistema (componente "Tarjeta/Módulo" en Figma).
 */

import React from 'react';
import { MODULOS } from '../../data/modulos.data';
import { EncabezadoSeccion } from '../EncabezadoSeccion';

export function ModulosSection() {
  return (
    <section id="modulos" aria-labelledby="modulos-titulo" className="scroll-mt-28 flex flex-col gap-12 pt-10 pb-24">
      <EncabezadoSeccion
        id="modulos-titulo"
        etiqueta="Módulos"
        titulo="Todo tu negocio en un solo panel"
        descripcion="Cada rol trabaja en su propia vista: cajeros, administradores de sede, vendedores B2B y el super admin, sobre los mismos datos en tiempo real."
      />

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULOS.map(({ id, titulo, descripcion, icono: Icono }) => (
          <li key={id} className="vidrio p-6 flex flex-col gap-3.5 transition-transform duration-200 hover:-translate-y-0.5">
            <span className="size-11 grid place-items-center rounded-[10px] bg-brand-500/15 border border-border">
              <Icono className="size-[22px] text-brand-600 dark:text-brand-300" aria-hidden="true" />
            </span>
            <h3 className="font-titulos text-lg font-semibold tracking-normal text-text">{titulo}</h3>
            <p className="font-sans text-[13px] leading-5 text-text-muted">{descripcion}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
