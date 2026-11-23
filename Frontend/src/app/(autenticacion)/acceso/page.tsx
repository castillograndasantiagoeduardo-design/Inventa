/**
 * page.tsx — Inicio de sesión de Inventa.
 *
 * Misma estética que la landing y el panel: fondo ambiental con retícula, menú de vidrio con
 * botón claro/oscuro y la tarjeta animada AuthCard (login, solicitud de cuenta y 2FA).
 */

import { FondoAmbiental } from '@/components/FondoAmbiental';
import { LandingNavbar } from '@/features/landing';
import { AuthCard } from '@/features/autenticacion/components/AuthCard';

export default function AccesoPage() {
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
        aria-label="Panel de autenticación Inventa"
      >
        <AuthCard />
      </main>

      <footer className="pb-5 text-center font-sans text-xs text-text-muted tabular-nums">
        Inventa &copy; {new Date().getFullYear()} &mdash; Sistema Integral de Gestión Comercial &amp; Logística
      </footer>
    </div>
  );
}
