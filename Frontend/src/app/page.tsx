/**
 * page.tsx — Landing pública de Inventa.
 *
 * Misma estética que el panel de Admin de sucursal: fondo ambiental con retícula,
 * superficies de vidrio y paleta activa (zafiro por defecto). Diseño en Figma:
 * "Inventa — Landing".
 */

import { FondoAmbiental } from '@/components/FondoAmbiental';
import {
  HeroSection,
  LandingFooter,
  LandingNavbar,
  ModulosSection,
  NosotrosSection,
  PlanesSection,
} from '@/features/landing';

export default function Home() {
  return (
    <div className="min-h-dvh bg-bg text-text font-sans relative isolate overflow-x-clip landing-raiz">
      <FondoAmbiental />
      {/* Brillos ámbar del logo, muy tenues, sobre el fondo ambiental de la paleta */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[2%] right-[6%] w-[460px] h-[340px] rounded-full bg-ambar/[0.09] dark:bg-ambar/[0.08] blur-[120px]" />
        <div className="absolute top-[58%] left-[30%] w-[620px] h-[360px] rounded-full bg-ambar/[0.07] dark:bg-ambar/[0.06] blur-[130px]" />
      </div>
      <LandingNavbar />
      <main className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-16">
        <HeroSection />
        <ModulosSection />
        <PlanesSection />
        <NosotrosSection />
        <LandingFooter />
      </main>
    </div>
  );
}
