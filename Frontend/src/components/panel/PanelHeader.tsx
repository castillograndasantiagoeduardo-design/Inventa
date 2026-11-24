'use client';

/**
 * PanelHeader.tsx — Barra superior flotante del panel del Super Admin (.vidrio-fuerte):
 * menú móvil, cápsula de alcance, selector de paleta (incluye "Mi empresa"),
 * modo claro/oscuro y cápsula de perfil con el logo de la empresa.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/features/autenticacion';
import { AvatarMarca } from '@/features/marca';
import { SelectorPaleta } from '@/components/SelectorPaleta';
import { Insignia } from '@/components/Insignia';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { etiquetaRol } from '@/lib/format/rol';

export function PanelHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { usuario } = useAuth();
  const [modo, setModo] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setModo(document.documentElement.classList.contains('light') ? 'light' : 'dark');
  }, []);

  const alternarModo = () => {
    const nuevo = modo === 'dark' ? 'light' : 'dark';
    setModo(nuevo);
    const d = document.documentElement;
    d.classList.toggle('light', nuevo === 'light');
    d.classList.toggle('dark', nuevo === 'dark');
    try {
      localStorage.setItem(STORAGE_KEYS.tema, nuevo);
    } catch {}
  };

  const rol = etiquetaRol(usuario?.rolNombre);
  // /auth/verificar no siempre devuelve el correo: tras recargar puede conocerse solo el rol.
  const nombre = usuario?.nombre || usuario?.email?.split('@')[0] || rol;
  const iniciales = (
    usuario?.nombre
      ? usuario.nombre
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
      : (usuario?.email || rol || '?').slice(0, 2)
  ).toUpperCase();

  return (
    <header className="sticky top-4 z-30 w-full overflow-visible">
      <div className="vidrio-fuerte px-4 sm:px-5 py-2.5 flex items-center justify-between gap-4 overflow-visible">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden superficie-control rounded-xl p-2 text-text-muted hover:text-text transition-colors cursor-pointer shrink-0"
            title="Abrir menú de navegación"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl superficie-control min-w-0">
            <Building2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="font-sans font-medium text-xs text-text truncate max-w-[160px] sm:max-w-[220px]">
              Todas las sedes
            </span>
            <Insignia variante="brand" conPunto tamano="sm" className="hidden sm:inline-flex">
              Vista global
            </Insignia>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SelectorPaleta />
          <button
            type="button"
            onClick={alternarModo}
            className="superficie-control rounded-xl p-2 text-text-muted hover:text-text transition-colors cursor-pointer"
            title={modo === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Cambiar tema de color"
          >
            {modo === 'dark' ? <Sun className="w-3.5 h-3.5 text-brand-400" /> : <Moon className="w-3.5 h-3.5 text-brand-500" />}
          </button>
          <Link
            href="/dashboard/cuenta"
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl superficie-control hover:border-brand-400/30 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            title="Mi cuenta"
          >
            <AvatarMarca className="w-7 h-7 rounded-lg bg-brand-600 text-btn-primario-texto flex items-center justify-center font-titulos font-semibold text-xs shadow-sm">
              {iniciales}
            </AvatarMarca>
            <div className="text-left hidden lg:block leading-tight">
              <div className="text-xs font-semibold text-text truncate max-w-[140px] capitalize">{nombre}</div>
              <div className="text-[10px] text-text-muted truncate max-w-[140px]">{rol}</div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
