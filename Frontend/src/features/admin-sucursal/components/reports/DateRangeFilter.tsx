'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar, AlertCircle } from 'lucide-react';
import {
  obtenerRangoPreset,
  validarRangoFechas,
  type PresetReporte,
} from '../../lib/date-range.utils';

interface DateRangeFilterProps {
  className?: string;
}

const PRESETS: { id: PresetReporte; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: 'mes', label: 'Este mes' },
  { id: 'personalizado', label: 'Personalizado' },
];

export function DateRangeFilter({ className = '' }: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlDesde = searchParams.get('desde');
  const urlHasta = searchParams.get('hasta');

  // Detectar preset activo inicial o por defecto (7d)
  const defaultRange = obtenerRangoPreset('7d');
  const [desde, setDesde] = useState<string>(urlDesde || defaultRange.desde);
  const [hasta, setHasta] = useState<string>(urlHasta || defaultRange.hasta);
  const [preset, setPreset] = useState<PresetReporte>(() => {
    if (!urlDesde && !urlHasta) return '7d';
    // Verificar si coincide con algún preset
    for (const p of ['hoy', '7d', '30d', 'mes'] as const) {
      const r = obtenerRangoPreset(p);
      if (r.desde === urlDesde && r.hasta === urlHasta) return p;
    }
    return 'personalizado';
  });

  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Sincronizar hacia la URL cuando cambian desde o hasta válidos
  const aplicarRango = (nuevoDesde: string, nuevoHasta: string, nuevoPreset?: PresetReporte) => {
    const validacion = validarRangoFechas(nuevoDesde, nuevoHasta);
    if (!validacion.valido) {
      setErrorValidacion(validacion.error || 'Rango de fechas inválido');
      return;
    }

    setErrorValidacion(null);
    setDesde(nuevoDesde);
    setHasta(nuevoHasta);
    if (nuevoPreset) setPreset(nuevoPreset);

    const params = new URLSearchParams(searchParams.toString());
    params.set('desde', nuevoDesde);
    params.set('hasta', nuevoHasta);
    router.push(`${pathname}?${params.toString()}`);
  };

  const seleccionarPreset = (p: PresetReporte) => {
    if (p === 'personalizado') {
      setPreset('personalizado');
      return;
    }
    const r = obtenerRangoPreset(p);
    aplicarRango(r.desde, r.hasta, p);
  };

  // Garantizar que la URL tenga parámetros desde/hasta al montar si están ausentes
  useEffect(() => {
    if (!urlDesde || !urlHasta) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('desde', desde);
      params.set('hasta', hasta);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [urlDesde, urlHasta, desde, hasta, pathname, router, searchParams]);

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Selector de Presets */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl superficie-control border border-border">
          {PRESETS.map((p) => {
            const isActive = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => seleccionarPreset(p.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-sans transition-all
                  ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-700 dark:text-slate-100 font-semibold border border-brand-600/40 shadow-xs'
                      : 'text-text-muted hover:text-text hover:bg-white/5 font-medium'
                  }
                `}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Inputs de fecha para Personalizado o referencia */}
        <div className="inline-flex items-center gap-2 text-xs font-sans">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl superficie-control border border-border text-text">
            <Calendar className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <input
              type="date"
              aria-label="Fecha inicial"
              value={desde}
              onChange={(e) => {
                setPreset('personalizado');
                aplicarRango(e.target.value, hasta, 'personalizado');
              }}
              className="bg-transparent border-0 text-xs font-mono text-text focus:outline-none focus:ring-0 p-0"
            />
            <span className="text-text-muted mx-1">al</span>
            <input
              type="date"
              aria-label="Fecha final"
              value={hasta}
              onChange={(e) => {
                setPreset('personalizado');
                aplicarRango(desde, e.target.value, 'personalizado');
              }}
              className="bg-transparent border-0 text-xs font-mono text-text focus:outline-none focus:ring-0 p-0"
            />
          </div>
        </div>
      </div>

      {/* Alerta de validación si el rango es inválido */}
      {errorValidacion && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-sans">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorValidacion}</span>
        </div>
      )}
    </div>
  );
}
