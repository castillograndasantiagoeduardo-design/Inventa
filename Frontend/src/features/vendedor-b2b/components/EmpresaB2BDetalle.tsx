'use client';

/**
 * EmpresaB2BDetalle.tsx — Detalle completo de una empresa B2B:
 * cupo aprobado/utilizado/disponible, rentabilidad frente al crédito otorgado,
 * obligaciones de cartera, abonos y avisos de pago.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import { formatCOP, formatPorcentaje } from '@/lib/format/moneda';
import { useEmpresaB2BDetalle } from '../hooks';
import type { AvisarPagoInput, CreditoB2BDto, SolicitarCreditoB2BInput } from '../types';
import { BADGE_ESTADO_CREDITO, BADGE_RIESGO } from './carteraBadges';
import { EmpresaB2BHistorial } from './EmpresaB2BHistorial';
import { SoltarCreditoModal } from './SoltarCreditoModal';
import { AvisarPagoModal } from './AvisarPagoModal';

export interface EmpresaB2BDetalleProps {
  clienteId: string;
}

export function EmpresaB2BDetalle({ clienteId }: EmpresaB2BDetalleProps) {
  const { detalle, cargando, error, sinPermiso, solicitarCredito, avisarPago } =
    useEmpresaB2BDetalle(clienteId);
  const [creditoAviso, setCreditoAviso] = useState<CreditoB2BDto | null>(null);
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  const handleSolicitarCredito = async (_id: string, payload: SolicitarCreditoB2BInput) => {
    const res = await solicitarCredito(payload);
    setNotificacion(
      `Solicitud enviada (cupo sugerido ${formatCOP(res.evaluacionCredito.cupoSugerido)}). Quedó pendiente de aprobación.`,
    );
  };

  const handleAvisarPago = async (creditoId: string, payload: AvisarPagoInput) => {
    const aviso = await avisarPago(creditoId, payload);
    setNotificacion(
      `Aviso de pago ${aviso.referencia} registrado en estado pendiente para revisión administrativa.`,
    );
  };

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="vidrio h-24 rounded-2xl animate-pulse" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="vidrio h-36 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (sinPermiso || error || !detalle) {
    return (
      <div className="space-y-4">
        <Link
          href="/vendedor-b2b/empresas"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl superficie-control text-xs font-medium text-text hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Mis empresas</span>
        </Link>
        <Tarjeta titulo={sinPermiso ? 'Acceso restringido (403)' : 'No disponible'}>
          <div className="py-6 text-center space-y-2">
            <ShieldAlert className="w-7 h-7 text-amber-400 mx-auto" />
            <p className="text-xs font-sans text-text-muted">
              {error ?? 'No se encontró la empresa B2B solicitada.'}
            </p>
          </div>
        </Tarjeta>
      </div>
    );
  }

  const badgeEstado = BADGE_ESTADO_CREDITO[detalle.estadoCredito];
  const badgeRiesgo = detalle.nivelRiesgoCredito ? BADGE_RIESGO[detalle.nivelRiesgoCredito] : null;
  const puedeSoltarCredito = !detalle.creditoHabilitado && detalle.estadoCredito !== 'aprobado';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/vendedor-b2b/empresas"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl superficie-control text-xs font-medium text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Mis empresas</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-titulos font-semibold text-text">
              {detalle.nombreRazonSocial}
            </h1>
            <Insignia variante={badgeEstado.variante} conPunto>{badgeEstado.label}</Insignia>
            {badgeRiesgo && <Insignia variante={badgeRiesgo.variante}>{badgeRiesgo.label}</Insignia>}
          </div>
          <p className="text-xs font-sans text-text-muted">
            <span className="font-mono">{detalle.tipoDocumento} {detalle.numeroDocumento}</span>
            {detalle.telefono ? ` · ${detalle.telefono}` : ''}
            {detalle.email ? ` · ${detalle.email}` : ''}
          </p>
        </div>

        {puedeSoltarCredito && (
          <button
            type="button"
            onClick={() => setModalSolicitud(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-colors cursor-pointer self-start"
          >
            <Sparkles className="w-4 h-4" />
            <span>Soltar crédito</span>
          </button>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tarjeta>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-muted">Cupo corporativo</p>
            <Wallet className="w-4 h-4 text-brand-400" />
          </div>
          <p className="mt-2 text-2xl font-titulos font-semibold text-text tabular-nums">
            {formatCOP(detalle.cupoCreditoDisponible)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted tabular-nums">
            Disponible · Aprobado: {formatCOP(detalle.cupoCreditoAprobado)}
          </p>
          <p className="mt-2 text-[11px] text-text-muted tabular-nums">
            Utilizado: {formatCOP(detalle.cupoCreditoUtilizado)} · Plazo: {detalle.plazoCreditoDias ?? 30} días
          </p>
        </Tarjeta>

        <Tarjeta>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-muted">Ganancia frente al crédito</p>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="mt-2 text-2xl font-titulos font-semibold text-text tabular-nums">
            {formatCOP(detalle.gananciaGenerada)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted tabular-nums">
            {detalle.rentabilidadSobreCredito !== null
              ? `Rentabilidad sobre cupo: ${formatPorcentaje(detalle.rentabilidadSobreCredito * 100)}`
              : 'Sin cupo aprobado asignado'}
          </p>
          <p className="mt-2 text-[11px] text-text-muted tabular-nums">
            Facturado: {formatCOP(detalle.totalFacturado)} · Dev.: {formatCOP(detalle.totalDevoluciones)}
          </p>
        </Tarjeta>

        <Tarjeta>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-muted">Resumen de cartera</p>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-titulos font-semibold text-text tabular-nums">
            {formatCOP(detalle.saldoPendiente)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted tabular-nums">
            Saldo pendiente · Vencido: {formatCOP(detalle.montoVencido)}
          </p>
          <p className="mt-2 text-[11px] text-text-muted tabular-nums">
            Vigentes: {detalle.creditosVigentesCount} · Pagados: {detalle.creditosPagadosCount}
            {detalle.antiguedadCarteraDias !== null ? ` · Antig.: ${detalle.antiguedadCarteraDias}d` : ''}
          </p>
        </Tarjeta>
      </div>

      <EmpresaB2BHistorial
        creditos={detalle.creditos}
        abonosRecientes={detalle.abonosRecientes}
        avisosPago={detalle.avisosPago}
        onAvisarPago={(cred) => setCreditoAviso(cred)}
      />

      <SoltarCreditoModal
        open={modalSolicitud}
        empresa={detalle}
        onClose={() => setModalSolicitud(false)}
        onSubmit={handleSolicitarCredito}
      />

      <AvisarPagoModal
        open={Boolean(creditoAviso)}
        credito={creditoAviso}
        onClose={() => setCreditoAviso(null)}
        onSubmit={handleAvisarPago}
      />
    </div>
  );
}
