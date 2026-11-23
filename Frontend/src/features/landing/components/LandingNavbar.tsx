'use client';

/**
 * LandingNavbar.tsx — Barra superior flotante (.vidrio-fuerte) de la landing.
 *
 * Marca la sección visible con un observador de intersección (scroll spy).
 */

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { InventaLogo } from '@/components/panel/InventaLogo';
import { InventaWordmark } from '@/components/panel/InventaWordmark';
import type { SeccionLanding } from '../types/landing.types';
import { BotonLanding } from './BotonLanding';
import { BotonTema } from './BotonTema';

const ENLACES: { id: SeccionLanding; etiqueta: string }[] = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'modulos', etiqueta: 'Módulos' },
  { id: 'planes', etiqueta: 'Planes' },
  { id: 'nosotros', etiqueta: 'Nosotros' },
];

/**
 * @param fueraDeLanding true en otras páginas (ej. /acceso): los enlaces apuntan a "/#seccion",
 *                       no se marca sección activa y se oculta el botón "Iniciar sesión".
 */
export function LandingNavbar({ fueraDeLanding = false }: { fueraDeLanding?: boolean }) {
  const [activa, setActiva] = useState<SeccionLanding | null>(fueraDeLanding ? null : 'inicio');
  const base = fueraDeLanding ? '/' : '';

  useEffect(() => {
    if (fueraDeLanding) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiva(visible.target.id as SeccionLanding);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    ENLACES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observador.observe(el);
    });
    return () => observador.disconnect();
  }, [fueraDeLanding]);

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-8 lg:px-16 pt-4 sm:pt-5">
      <nav
        aria-label="Navegación principal"
        className="vidrio-fuerte flex items-center justify-between gap-4 rounded-2xl pl-4 pr-3 sm:pl-5 py-2.5"
      >
        <Link href={`${base}#inicio`} aria-label="Inventa, ir al inicio" className="flex items-center gap-2.5 shrink-0">
          <InventaLogo className="w-9 rounded-lg" />
          <InventaWordmark className="text-[26px] text-text" />
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {ENLACES.map(({ id, etiqueta }) => (
            <li key={id}>
              <a
                href={`${base}#${id}`}
                aria-current={activa === id ? 'true' : undefined}
                className={`block rounded-[10px] px-3.5 py-2 font-sans text-sm font-medium transition-colors ${
                  activa === id ? 'superficie-control text-text' : 'text-text-muted hover:text-text'
                }`}
              >
                {etiqueta}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <BotonTema />
          {!fueraDeLanding && (
            <BotonLanding href="/acceso" variante="secundario" className="!px-4 !py-2.5">
              Iniciar sesión
            </BotonLanding>
          )}
          <span className="hidden sm:inline-flex">
            <BotonLanding href={`${base}#nosotros`} className="!px-4 !py-2.5">
              Solicitar demo
            </BotonLanding>
          </span>
        </div>
      </nav>
    </header>
  );
}
