'use client';

/**
 * page.tsx — Recuperación de contraseña con código OTP.
 *
 * Misma estética que el inicio de sesión: fondo ambiental, menú de vidrio con botón
 * claro/oscuro y la tarjeta GlassyOtpCard (correo → código → nueva contraseña).
 */

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FondoAmbiental } from '@/components/FondoAmbiental';
import { LandingNavbar } from '@/features/landing';
import { GlassyOtpCard } from '@/features/autenticacion/components/GlassyOtpCard';

function RecuperarPasswordContenido() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  return (
    <div className="min-h-dvh bg-bg text-text font-sans relative isolate overflow-x-clip flex flex-col">
      <FondoAmbiental />
      {/* Brillo ámbar del logo, muy tenue */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[12%] right-[10%] w-[420px] h-[320px] rounded-full bg-ambar/[0.09] dark:bg-ambar/[0.07] blur-[120px]" />
      </div>

      <LandingNavbar fueraDeLanding />

      <main
        className="flex-1 w-full flex items-center justify-center px-4 py-12"
        aria-label="Recuperación de contraseña"
      >
        <GlassyOtpCard emailInicial={emailParam} />
      </main>

      <footer className="pb-5 text-center font-sans text-xs text-text-muted tabular-nums">
        Inventa &copy; {new Date().getFullYear()} &mdash; Sistema de Seguridad y Autenticación Criptográfica
      </footer>
    </div>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <RecuperarPasswordContenido />
    </Suspense>
  );
}
