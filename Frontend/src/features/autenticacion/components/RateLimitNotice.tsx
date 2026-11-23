'use client';

/**
 * RateLimitNotice.tsx — Aviso de bloqueo temporal por fuerza bruta (HTTP 429).
 *
 * Principio SOLID:
 * - Single Responsibility: Muestra el estado de bloqueo temporal y el temporizador regresivo
 *   sin contaminar los formularios de ingreso.
 */

import React from 'react';
import { TriangleAlert } from 'lucide-react';

interface RateLimitNoticeProps {
  mensaje?: string;
  tiempoRestanteSegundos?: number;
}

export function RateLimitNotice({
  mensaje = 'Demasiados intentos fallidos. Por tu seguridad, el acceso ha sido pausado temporalmente.',
  tiempoRestanteSegundos = 0,
}: RateLimitNoticeProps) {
  const minutos = Math.floor(tiempoRestanteSegundos / 60);
  const segundos = tiempoRestanteSegundos % 60;
  const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

  return (
    <div
      role="alert"
      className="w-full rounded-[10px] p-3.5 mb-4 bg-amber-50 text-amber-800 dark:bg-amber-500/12 dark:text-amber-300 ring-1 ring-inset ring-amber-600/25 font-sans text-xs animate-in fade-in duration-300"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 space-y-1">
          <h4 className="font-semibold text-[13px]">Acceso en pausa temporal</h4>
          <p className="leading-relaxed text-text-muted">{mensaje}</p>
          {tiempoRestanteSegundos > 0 && (
            <p className="pt-1 font-medium tabular-nums">
              Podrás reintentar en: <span className="font-mono">{tiempoFormateado}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
