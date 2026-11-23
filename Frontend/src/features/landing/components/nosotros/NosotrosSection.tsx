/**
 * NosotrosSection.tsx — Tarjeta "Sobre Inventa" con llamado a la acción final.
 */

import React from 'react';
import { BotonLanding } from '../BotonLanding';
import { EstrellaInventa } from '@/components/panel/EstrellaInventa';

export function NosotrosSection() {
  return (
    <section id="nosotros" aria-labelledby="nosotros-titulo" className="scroll-mt-28 pb-24">
      <div className="vidrio relative overflow-hidden p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
        <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-ambar/10 dark:bg-ambar/[0.07] blur-3xl" />
        <div className="flex-1 flex flex-col gap-3.5">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-brand-600 dark:text-brand-300">
            <EstrellaInventa />
            Sobre Inventa
          </span>
          <h2
            id="nosotros-titulo"
            className="font-titulos font-semibold text-text text-3xl sm:text-[38px] sm:leading-[46px] tracking-[-0.005em]"
          >
            Lleva tu negocio a otro nivel
          </h2>
          <p className="font-sans text-base sm:text-lg leading-[1.65] text-text-muted">
            Inventa es la plataforma empresarial diseñada para potenciar la gestión multi-sucursal, la
            facturación POS en tiempo real y la trazabilidad logística, sin límites.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <BotonLanding href="/acceso" variante="secundario">
            Iniciar sesión
          </BotonLanding>
          <BotonLanding href="#planes">Ver planes</BotonLanding>
        </div>
      </div>
    </section>
  );
}
