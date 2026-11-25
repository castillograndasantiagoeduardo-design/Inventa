/**
 * PageHeader.tsx — Título de sección con subtítulo y acciones a la derecha.
 */

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Enlace o migas de pan sobre el título. */
  back?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, back }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && <div className="mb-2 text-sm">{back}</div>}
        <h1 className="font-titulos font-semibold tracking-[-0.005em] text-3xl text-text">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-text-muted font-sans">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
