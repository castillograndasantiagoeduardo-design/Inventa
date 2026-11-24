'use client';

import React from 'react';
import type { CategoriaInventario } from '../../types/branch-inventory.types';

interface CategoryCardProps {
  categoria: CategoriaInventario;
  onEditar: (cat: CategoriaInventario) => void;
  onToggleEstado: (cat: CategoriaInventario) => void;
}

export function CategoryCard({ categoria, onEditar, onToggleEstado }: CategoryCardProps) {
  const isActive = categoria.isActive ?? true;
  const count = categoria.totalProductos ?? 0;

  return (
    <div className="vidrio rounded-2xl p-5 flex flex-col justify-between hover:border-brand-500/30 transition-all">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-base font-bold text-text leading-tight">
            {categoria.nombre}
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-text-muted dark:border-white/10'
            }`}
          >
            {isActive ? 'Activa' : 'Inactiva'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs mb-4">
          <span className="text-text-muted">Código:</span>
          <span className="font-mono text-text">CAT-{categoria.id}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Productos asociados:</span>
          <span className="px-2 py-0.5 rounded-md superficie-control font-mono font-bold text-text tabular-nums">
            {count}
          </span>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-border flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onEditar(categoria)}
          className="px-3 py-1.5 rounded-xl border border-border superficie-control text-text-muted hover:text-text text-xs font-medium transition-colors cursor-pointer"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onToggleEstado(categoria)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            isActive
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {isActive ? 'Inactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
