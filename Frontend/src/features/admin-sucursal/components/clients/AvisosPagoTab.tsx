'use client';

/**
 * AvisosPagoTab.tsx — Bandeja administrativa de avisos de pago reportados por
 * el Vendedor B2B para confirmar (aplica abono atómico) o rechazar con motivo.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BellRing, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { resolverAvisoPagoSchema, type AvisoPagoCreditoDto, type EstadoAvisoPago } from '@inventa/contracts';
import { Tarjeta } from '@/components/Tarjeta';
import { Insignia } from '@/components/Insignia';
import { formatCOP } from '@/lib/format/moneda';
import { branchClientsService } from '../../api/branch-clients.service';

export interface AvisosPagoTabProps {
  puedeResolver: boolean;
  onResuelto?: () => void;
}

const BADGE_AVISO = {
  pendiente: { label: 'Pendiente', variante: 'warning' as const },
  confirmado: { label: 'Confirmado', variante: 'success' as const },
  rechazado: { label: 'Rechazado', variante: 'danger' as const },
};

export function AvisosPagoTab({ puedeResolver, onResuelto }: AvisosPagoTabProps) {
  const [avisos, setAvisos] = useState<AvisoPagoCreditoDto[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoAvisoPago | undefined>('pendiente');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [avisoRechazoId, setAvisoRechazoId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await branchClientsService.listarAvisosPago({
        estado: estadoFiltro,
        pagina: 1,
        limite: 30,
      });
      setAvisos(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar los avisos de pago.');
    } finally {
      setCargando(false);
    }
  }, [estadoFiltro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const handleConfirmar = async (aviso: AvisoPagoCreditoDto) => {
    setProcesandoId(aviso.id);
    setError(null);
    setMensaje(null);
    try {
      await branchClientsService.resolverAvisoPago(aviso.id, { decision: 'confirmar' });
      setMensaje(
        `Aviso ${aviso.referencia} confirmado. Se aplicó abono por ${formatCOP(aviso.monto)} y se liberó el cupo.`,
      );
      await cargar();
      onResuelto?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible confirmar el aviso.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (avisoId: string) => {
    const parsed = resolverAvisoPagoSchema.safeParse({
      decision: 'rechazar',
      motivoRechazo,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Indica un motivo válido (mínimo 5 caracteres).');
      return;
    }

    setProcesandoId(avisoId);
    setError(null);
    setMensaje(null);
    try {
      await branchClientsService.resolverAvisoPago(avisoId, parsed.data);
      setAvisoRechazoId(null);
      setMotivoRechazo('');
      setMensaje('Aviso de pago rechazado. No se modificó el saldo del crédito.');
      await cargar();
      onResuelto?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible rechazar el aviso.');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="vidrio p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'pendiente', label: 'Pendientes' },
              { key: 'confirmado', label: 'Confirmados' },
              { key: 'rechazado', label: 'Rechazados' },
              { key: undefined, label: 'Todos' },
            ] as const
          ).map((op) => (
            <button
              key={op.label}
              type="button"
              onClick={() => setEstadoFiltro(op.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
                estadoFiltro === op.key
                  ? 'bg-brand-600 text-white'
                  : 'superficie-control text-text-muted hover:text-text'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void cargar()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl superficie-control text-xs font-medium text-text hover:text-brand-400 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {mensaje && (
        <div className="vidrio p-3.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 text-xs">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="vidrio p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      <Tarjeta
        titulo="Bandeja de avisos de pago B2B"
        subtitulo="Revisa las transferencias reportadas por el Vendedor B2B antes de liberar cupo"
        sinRelleno
      >
        {cargando ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl superficie-control animate-pulse" />
            ))}
          </div>
        ) : avisos.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <BellRing className="w-7 h-7 text-text-muted mx-auto" />
            <p className="text-sm font-titulos font-semibold text-text">
              No hay avisos de pago en este estado
            </p>
            <p className="text-xs font-sans text-text-muted">
              Cuando el Vendedor B2B reporte un pago aparecerá aquí para confirmación.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {avisos.map((av) => {
              const badge = BADGE_AVISO[av.estado];
              const ocupando = procesandoId === av.id;
              return (
                <div key={av.id} className="p-4 sm:p-5 space-y-3 text-xs font-sans">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-text">{av.clienteNombre}</span>
                        <span className="font-mono text-text-muted">
                          FAC-{String(av.facturaConsecutivo).padStart(4, '0')}
                        </span>
                        <Insignia variante={badge.variante} conPunto>{badge.label}</Insignia>
                      </div>
                      <p className="text-text-muted">
                        Referencia: <span className="font-mono text-text">{av.referencia}</span>
                        {' · '}Reportado por: {av.avisadoPorNombre ?? 'Vendedor B2B'}
                      </p>
                      {av.nota && <p className="text-[11px] text-text-muted">Nota: {av.nota}</p>}
                      {av.motivoRechazo && (
                        <p className="text-[11px] text-red-400">Motivo rechazo: {av.motivoRechazo}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right tabular-nums">
                        <p className="text-base font-titulos font-semibold text-text">
                          {formatCOP(av.monto)}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Saldo crédito: {formatCOP(av.saldoActualCredito)}
                        </p>
                      </div>

                      {av.estado === 'pendiente' && puedeResolver && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={ocupando}
                            onClick={() => void handleConfirmar(av)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 cursor-pointer"
                          >
                            {ocupando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Confirmar</span>
                          </button>
                          <button
                            type="button"
                            disabled={ocupando}
                            onClick={() => {
                              setAvisoRechazoId(avisoRechazoId === av.id ? null : av.id);
                              setMotivoRechazo('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 font-medium cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {avisoRechazoId === av.id && (
                    <div className="p-3 rounded-xl superficie-control flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        type="text"
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        placeholder="Indica el motivo del rechazo (mínimo 5 caracteres)..."
                        className="flex-1 bg-transparent border border-border rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={ocupando}
                        onClick={() => void handleRechazar(av.id)}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                      >
                        Confirmar rechazo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
