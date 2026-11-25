'use client';

/**
 * MisEmpresasView.tsx — Vista principal de la sección "Mis empresas" (Vendedor B2B).
 */

import React, { useState } from 'react';
import { AlertTriangle, Building2, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { useEmpresasB2B, useCarteraB2B } from '../hooks';
import type { EmpresaB2BResumenDto } from '../types';
import { CarteraKPIs } from './CarteraKPIs';
import { EmpresaB2BTabla } from './EmpresaB2BTabla';

type TabMisEmpresas = 'empresas' | 'cartera' | 'mora';

export function MisEmpresasView() {
  const [tab, setTab] = useState<TabMisEmpresas>('empresas');
  const [empresaSolicitud, setEmpresaSolicitud] = useState<EmpresaB2BResumenDto | null>(null);

  const {
    empresas,
    resumen,
    filtros,
    setFiltros,
    limpiarFiltros,
    cargando,
    error,
    sinPermiso,
    recargar,
  } = useEmpresasB2B();

  const { mora, cargarCartera, cargarMora } = useCarteraB2B();

  const handleRecargar = () => {
    void recargar();
    void cargarCartera();
    void cargarMora();
  };

  if (sinPermiso) {
    return (
      <Tarjeta titulo="Acceso restringido">
        <div className="py-8 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-titulos font-semibold text-text">
            Sin permisos suficientes (403)
          </p>
          <p className="text-xs font-sans text-text-muted">{error}</p>
        </div>
      </Tarjeta>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-titulos font-semibold tracking-[-0.005em] text-text">
            Mis empresas
          </h1>
          <p className="text-sm font-sans font-medium text-text-muted mt-1">
            Cartera corporativa B2B, cupos de crédito, rentabilidad comercial y avisos de pago.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRecargar}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl superficie-control text-xs font-sans font-medium text-text hover:text-brand-400 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div className="vidrio p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-xs font-sans">{error}</p>
        </div>
      )}

      <CarteraKPIs resumen={resumen} cargando={cargando} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('empresas')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
            tab === 'empresas'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'superficie-control text-text-muted hover:text-text'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Empresas B2B ({empresas.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('cartera')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
            tab === 'cartera'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'superficie-control text-text-muted hover:text-text'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Cartera y tiempo pagando</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('mora')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
            tab === 'mora'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'superficie-control text-text-muted hover:text-text'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>En mora ({mora.length})</span>
        </button>
      </div>

      {tab === 'empresas' && (
        <EmpresaB2BTabla
          empresas={empresas}
          filtros={filtros}
          onChangeFiltros={setFiltros}
          onLimpiarFiltros={limpiarFiltros}
          onSoltarCredito={(emp) => setEmpresaSolicitud(emp)}
          cargando={cargando}
        />
      )}

      {tab === 'cartera' && (
        <Tarjeta titulo="Cartera y tiempo pagando">
          <p className="text-xs font-sans text-text-muted">
            Panel de cartera disponible para seguimiento de obligaciones.
          </p>
        </Tarjeta>
      )}

      {tab === 'mora' && (
        <Tarjeta titulo="Empresas en mora">
          <p className="text-xs font-sans text-text-muted">
            Panel de mora y seguimiento de cobro.
          </p>
        </Tarjeta>
      )}

      {empresaSolicitud && (
        <div className="sr-only" aria-hidden="true">
          {empresaSolicitud.nombreRazonSocial}
        </div>
      )}
    </div>
  );
}
