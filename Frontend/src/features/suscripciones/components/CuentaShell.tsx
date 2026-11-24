/**
 * CuentaShell.tsx — Marco común de las páginas de cuenta, compra y pago:
 * fondo ambiental, menú de la landing (con botón claro/oscuro) y pie sutil.
 */

import React from 'react';
import { FondoAmbiental } from '@/components/FondoAmbiental';
import { LandingNavbar } from '@/features/landing';

export function CuentaShell({
  children,
  etiqueta,
  accion = 'mi-cuenta',
}: {
  children: React.ReactNode;
  etiqueta: string;
  accion?: 'crear-cuenta' | 'mi-cuenta' | 'ninguna';
}) {
  return (
    <div className="min-h-dvh bg-bg text-text font-sans relative isolate overflow-x-clip flex flex-col">
      <FondoAmbiental />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[12%] right-[10%] w-[420px] h-[320px] rounded-full bg-ambar/[0.09] dark:bg-ambar/[0.07] blur-[120px]" />
      </div>

      <LandingNavbar fueraDeLanding accion={accion} />

      <main className="flex-1 w-full flex items-start sm:items-center justify-center px-4 py-10 sm:py-12" aria-label={etiqueta}>
        {children}
      </main>

      <footer className="pb-5 text-center font-sans text-xs text-text-muted tabular-nums">
        Inventa &copy; {new Date().getFullYear()} &mdash; Sistema Integral de Gestión Comercial &amp; Logística
      </footer>
    </div>
  );
}

/** Tarjeta de vidrio centrada con el filo ámbar superior. */
export function TarjetaCuenta({ children, ancho = 'max-w-[460px]' }: { children: React.ReactNode; ancho?: string }) {
  return (
    <div className={`vidrio relative overflow-hidden rounded-2xl w-full ${ancho} p-7 sm:p-8`}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-ambar/60 to-transparent" />
      {children}
    </div>
  );
}
