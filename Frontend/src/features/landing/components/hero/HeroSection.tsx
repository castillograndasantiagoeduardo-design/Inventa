/**
 * HeroSection.tsx — Sección de inicio: propuesta de valor + vista previa del panel.
 */

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Insignia } from '@/components/Insignia';
import { BotonLanding } from '../BotonLanding';
import { VistaPreviaPanel } from './VistaPreviaPanel';
import { EstrellaInventa } from '../EstrellaInventa';

const GARANTIAS = ['Multi-sucursal', 'Auditoría inmutable', 'Roles y permisos'];

export function HeroSection() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-titulo"
      className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] items-center gap-12 lg:gap-14 pt-16 lg:pt-24 pb-20 lg:pb-24"
    >
      <div className="min-w-0 flex flex-col gap-6">
        <Insignia variante="brand" icono={<EstrellaInventa />} tamano="md" className="self-start">
          ERP · POS multi-sucursal
        </Insignia>

        <h1
          id="hero-titulo"
          className="font-titulos font-semibold text-text text-[40px] leading-[1.12] sm:text-5xl lg:text-[60px] lg:leading-[68px] tracking-[-0.015em]"
        >
          Administración, ventas y logística <span className="text-brand-600 dark:text-brand-300">a otro nivel</span>
        </h1>

        <p className="font-sans text-base sm:text-lg leading-[1.65] text-text-muted">
          Inventa centraliza el punto de venta, el inventario de cada sede, la venta B2B y la auditoría en un
          solo sistema, con roles y permisos para todo tu equipo.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <BotonLanding href="#nosotros">
            Solicitar demo
            <ArrowRight className="size-4" aria-hidden="true" />
          </BotonLanding>
          <BotonLanding href="#planes" variante="secundario">
            Ver planes
          </BotonLanding>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
          {GARANTIAS.map((g) => (
            <li key={g} className="flex items-center gap-1.5 font-sans text-[13px] text-text-muted">
              <Check className="size-4 text-brand-400" aria-hidden="true" />
              {g}
            </li>
          ))}
        </ul>
      </div>

      <VistaPreviaPanel />
    </section>
  );
}
