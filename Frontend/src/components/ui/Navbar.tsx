'use client';

import React from 'react';
import { Button3D } from './Button3D';
import { InventaLogo } from '@/components/panel/InventaLogo';
import { InventaWordmark } from '@/components/panel/InventaWordmark';

export type TabType = 'inicio' | 'alcance' | 'planes' | 'nosotros';

interface NavbarProps {
  activeTab: TabType;
  onNavigate: (tab: TabType) => void;
  accentColor?: string;
}

export function Navbar({ activeTab, onNavigate }: NavbarProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-[max(3vw,env(safe-area-inset-left))] pt-[max(1.1vw,env(safe-area-inset-top))] transition-all duration-300">
      {/* Logotipo Inventa */}
      <a
        href="#inicio"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('inicio');
        }}
        className="flex items-center gap-[clamp(8px,0.8vw,14px)] select-none"
        aria-label="Inventa Inicio"
      >
        <InventaLogo className="w-[clamp(32px,3.4vw,56px)] rounded-lg" />
        {/* En móvil solo el isotipo: la palabra no cabe junto al menú */}
        <span className="hidden md:inline-flex">
          <InventaWordmark className="text-[clamp(22px,2.2vw,38px)] text-white" />
        </span>
      </a>

      {/* Navegación */}
      <nav aria-label="Navegación principal">
        <ul className="flex items-center gap-[clamp(14px,3.8vw,48px)] ml-[2vw] list-none">
          <li>
            <button type="button"
              onClick={() => onNavigate('inicio')}
              className={`font-[family-name:var(--font-ui)] text-[clamp(12px,1.5vw,26px)] tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'inicio'
                  ? 'text-[var(--ac,var(--gold))] border-[var(--ac,var(--gold))]'
                  : 'text-white/90 border-transparent hover:text-[var(--gold)]'
              }`}
            >
              INICIO
            </button>
          </li>
          <li>
            <button type="button"
              onClick={() => onNavigate('alcance')}
              className={`font-[family-name:var(--font-ui)] text-[clamp(12px,1.5vw,26px)] tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'alcance'
                  ? 'text-[var(--ac,var(--gold))] border-[var(--ac,var(--gold))]'
                  : 'text-white/90 border-transparent hover:text-[var(--gold)]'
              }`}
            >
              ALCANCE
            </button>
          </li>
          <li>
            <button type="button"
              onClick={() => onNavigate('planes')}
              className={`font-[family-name:var(--font-ui)] text-[clamp(12px,1.5vw,26px)] tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'planes'
                  ? 'text-[var(--ac,var(--gold))] border-[var(--ac,var(--gold))]'
                  : 'text-white/90 border-transparent hover:text-[var(--gold)]'
              }`}
            >
              PLANES
            </button>
          </li>
          <li>
            <button type="button"
              onClick={() => onNavigate('nosotros')}
              className={`font-[family-name:var(--font-ui)] text-[clamp(12px,1.5vw,26px)] tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'nosotros'
                  ? 'text-[var(--ac,var(--gold))] border-[var(--ac,var(--gold))]'
                  : 'text-white/90 border-transparent hover:text-[var(--gold)]'
              }`}
            >
              NOSOTROS
            </button>
          </li>
        </ul>
      </nav>

      {/* Botón Acción: Acceso / Login */}
      <Button3D
        href="/acceso"
        className="ml-auto"
      >
        INICIAR
      </Button3D>
    </header>
  );
}
