'use client';

/**
 * MisEmpresasView.tsx — Vista principal de la sección "Mis empresas" (Vendedor B2B).
 */

import React, { useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, Clock, ShieldAlert, RefreshCw, X } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { useEmpresasB2B, useCarteraB2B } from '../hooks';
import type { CreditoB2BDto, EmpresaB2BResumenDto, SolicitarCreditoB2BInput } from '../types';
import { CarteraKPIs } from './CarteraKPIs';
import { EmpresaB2BTabla } from './EmpresaB2BTabla';
import { CarteraPanel } from './CarteraPanel';
import { MoraPanel } from './MoraPanel';
import { SoltarCreditoModal } from './SoltarCreditoModal';

type TabMisEmpresas = 'empresas' | 'cartera' | 'mora';

export function MisEmpresasView() {
  const [tab, setTab] = useState<TabMisEmpresas>('empresas');
  const [empresaSolicitud, setEmpresaSolicitud] = useState<EmpresaB2BResumenDto | null>(null);
  const [creditoAviso, setCreditoAviso] = useState<CreditoB2BDto | null>(null);
  const [notificacion, setNotificacion] = useState<string | null>(null);

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
    solicitarCredito,
  } = useEmpresasB2B();

  const {
    creditos,
    totalCreditos,
    pagina,
    setPagina,
    limite,
    estadoFiltro,
    cambiarEstadoFiltro,
    resumenCartera,
    mora,
    cargandoCartera,
    cargandoMora,
    errorCartera,
    errorMora,
    cargarCartera,
    cargarMora,
  } = useCarteraB2B();

  const handleRecargar = () => {
    void recargar();
    void cargarCartera();
    void cargarMora();
  };

  const handleSolicitarCredito = async (clienteId: string, payload: SolicitarCreditoB2BInput) => {
    const res = await solicitarCredito(clienteId, payload);
    setNotificacion(
      `Solicitud enviada para ${res.cliente.nombreRazonSocial} (cupo sugerido $${res.evaluacionCredito.cupoSugerido.toLocaleString('es-CO')} COP). Quedó pendiente de aprobación.`,
    );
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

      {notificacion && (
        <div className="vidrio p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-xs font-sans">{notificacion}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotificacion(null)}
            className="p-1 rounded-lg hover:bg-green-500/10 cursor-pointer shrink-0"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
        <CarteraPanel
          creditos={creditos}
          totalCreditos={totalCreditos}
          pagina={pagina}
          limite={limite}
          estadoFiltro={estadoFiltro}
          resumen={resumenCartera}
          cargando={cargandoCartera}
          error={errorCartera}
          onCambiarEstado={cambiarEstadoFiltro}
          onCambiarPagina={setPagina}
          onAvisarPago={(cred) => setCreditoAviso(cred)}
        />
      )}

      {tab === 'mora' && (
        <MoraPanel empresasMora={mora} cargando={cargandoMora} error={errorMora} />
      )}

      <SoltarCreditoModal
        open={Boolean(empresaSolicitud)}
        empresa={empresaSolicitud}
        onClose={() => setEmpresaSolicitud(null)}
        onSubmit={handleSolicitarCredito}
      />

      {creditoAviso && (
        <div className="sr-only" aria-hidden="true">
          {creditoAviso.id}
        </div>
      )}
    </div>
  );
}
