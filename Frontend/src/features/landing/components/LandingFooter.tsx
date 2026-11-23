/**
 * LandingFooter.tsx — Pie de página de la landing.
 */

import React from 'react';
import { InventaLogo } from '@/components/panel/InventaLogo';
import { InventaWordmark } from '@/components/panel/InventaWordmark';

export function LandingFooter() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-7 pb-10">
      <div className="flex items-center gap-2">
        <InventaLogo className="w-7 rounded-md" />
        <InventaWordmark className="text-xl text-text" />
      </div>
      <p className="font-sans text-[13px] text-text-muted text-center tabular-nums">
        © {new Date().getFullYear()} Inventa — Sistema Integral de Gestión Comercial &amp; Logística
      </p>
    </footer>
  );
}
