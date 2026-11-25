'use client';

/**
 * PosShortcutsBar.tsx — Barra inferior de referencia de atajos de teclado para el cajero.
 */

import React from 'react';

export function PosShortcutsBar() {
  const shortcuts = [
    { key: 'F2', action: 'Buscar Producto / Escanear' },
    { key: 'F4', action: 'Cobrar Orden' },
    { key: 'F8', action: 'Historial de Comprobantes' },
    { key: 'F9', action: 'Alertar Administrador' },
    { key: 'ESC', action: 'Cerrar / Cancelar' },
  ];

  return (
    <footer className="h-9 px-4 vidrio-fuerte rounded-none border-x-0 border-b-0 flex items-center justify-between text-[11px] text-text-muted select-none z-20">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
        {shortcuts.map((sc) => (
          <div key={sc.key} className="flex items-center gap-1.5 whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 rounded superficie-control text-text font-mono text-[10px] font-semibold shadow-xs">
              {sc.key}
            </kbd>
            <span className="text-text-muted">{sc.action}</span>
          </div>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-2 text-[10px] text-text-muted font-mono">
        <span>Inventa Terminal v2.0</span>
        <span>·</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">En Línea</span>
      </div>
    </footer>
  );
}
