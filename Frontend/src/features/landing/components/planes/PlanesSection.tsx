/**
 * PlanesSection.tsx — Tarjetas de planes (componente "Tarjeta/Plan" en Figma; Destacado = Sí para Tienda).
 */

import React from 'react';
import { Check } from 'lucide-react';
import { Insignia } from '@/components/Insignia';
import { PLANES } from '../../data/planes.data';
import { BotonLanding } from '../BotonLanding';
import { EncabezadoSeccion } from '../EncabezadoSeccion';
import { EstrellaInventa } from '@/components/panel/EstrellaInventa';

export function PlanesSection() {
  return (
    <section id="planes" aria-labelledby="planes-titulo" className="scroll-mt-28 flex flex-col gap-12 pb-24">
      <EncabezadoSeccion
        id="planes-titulo"
        etiqueta="Planes"
        titulo="Planes a la medida de tu operación"
        descripcion="Empieza con una sede y crece a todas las que necesites. Precios mensuales en pesos colombianos."
      />

      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {PLANES.map((plan) => (
          <li
            key={plan.id}
            className={`vidrio relative p-7 flex flex-col gap-5 ${plan.destacado ? '!border-brand-500 !bg-brand-500/10' : ''}`}
          >
            {plan.destacado && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-ambar to-transparent" />
            )}
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-titulos text-lg font-semibold tracking-normal text-text">{plan.nombre}</h3>
              {plan.destacado ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-medium bg-ambar/12 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-ambar/35">
                  <EstrellaInventa />
                  {plan.etiqueta}
                </span>
              ) : (
                <Insignia variante="brand" conPunto>
                  {plan.etiqueta}
                </Insignia>
              )}
            </div>

            <p className="flex items-baseline gap-1.5">
              <span className="font-titulos text-[40px] leading-[48px] font-semibold tracking-[-0.01em] text-text tabular-nums">
                {plan.precio}
              </span>
              <span className="font-sans text-[13px] text-text-muted">COP / mes</span>
            </p>

            <p className="font-sans text-[13px] leading-5 text-text-muted">{plan.descripcion}</p>

            <hr className="border-border" />

            <ul className="flex flex-col gap-3 flex-1">
              {plan.caracteristicas.map((c) => (
                <li key={c} className="flex items-center gap-2.5 font-sans text-[13px] text-text">
                  <Check className="size-4 shrink-0 text-brand-400" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>

            <BotonLanding href={`/cuenta/comprar?plan=${plan.id}`} variante={plan.destacado ? 'primario' : 'secundario'} className="w-full">
              {plan.cta}
            </BotonLanding>
          </li>
        ))}
      </ul>
    </section>
  );
}
