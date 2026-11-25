/**
 * EmptyState.tsx — Mensaje para listas vacías, errores recuperables o vistas pendientes.
 */

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Acción opcional (ej. botón "Crear sucursal" o "Reintentar"). */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center gap-3 py-12 px-6 ${className}`}>
      <div className="text-4xl text-brand-500/70" aria-hidden="true">
        {icon ?? '◇'}
      </div>
      <h3 className="font-titulos font-semibold tracking-[-0.005em] text-lg text-text">{title}</h3>
      {description && <p className="max-w-md text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
