'use client';

/**
 * BotonTema.tsx — Alterna modo oscuro / claro. Misma lógica y clave de localStorage
 * que el panel (BranchHeader), así la preferencia se comparte entre landing y panel.
 */

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage-keys';

type Modo = 'dark' | 'light';

export function BotonTema() {
  const [modo, setModo] = useState<Modo>('dark');

  useEffect(() => {
    setModo(document.documentElement.classList.contains('light') ? 'light' : 'dark');
  }, []);

  const alternar = () => {
    const nuevo: Modo = modo === 'dark' ? 'light' : 'dark';
    setModo(nuevo);
    const d = document.documentElement;
    d.classList.toggle('light', nuevo === 'light');
    d.classList.toggle('dark', nuevo === 'dark');
    localStorage.setItem(STORAGE_KEYS.tema, nuevo);
  };

  const etiqueta = modo === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button
      type="button"
      onClick={alternar}
      title={etiqueta}
      aria-label={etiqueta}
      className="superficie-control grid size-10 place-items-center rounded-[10px] border border-border text-text-muted transition-colors hover:text-text hover:border-ambar/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      {modo === 'dark' ? (
        <Sun className="size-4 text-ambar" aria-hidden="true" />
      ) : (
        <Moon className="size-4 text-brand-500" aria-hidden="true" />
      )}
    </button>
  );
}
