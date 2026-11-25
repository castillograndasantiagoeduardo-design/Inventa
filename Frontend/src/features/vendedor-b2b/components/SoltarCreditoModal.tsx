'use client';

/**
 * SoltarCreditoModal.tsx — Modal "Soltar crédito" para registrar una solicitud de
 * crédito corporativo B2B con datos de ganancia neta y simulación previa (EvaluadorCreditoB2B).
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { PLAZOS_CREDITO_DIAS, solicitarCreditoB2BSchema } from '@inventa/contracts';
import { Insignia } from '@/components/Insignia';
import { formatCOP } from '@/lib/format/moneda';
import { carterasService } from '../api';
import type {
  EmpresaB2BResumenDto,
  EvaluacionCreditoB2BDto,
  PlazoCreditoDias,
  SolicitarCreditoB2BInput,
} from '../types';
import { ModalVidrio } from './ModalVidrio';
import { BADGE_RIESGO } from './carteraBadges';

export interface SoltarCreditoModalProps {
  open: boolean;
  empresa: Pick<
    EmpresaB2BResumenDto,
    'id' | 'nombreRazonSocial' | 'gananciaNetaMensual' | 'antiguedadEmpresaMeses' | 'plazoCreditoDias' | 'observacionFinanciera'
  > | null;
  onClose: () => void;
  onSubmit: (clienteId: string, payload: SolicitarCreditoB2BInput) => Promise<void>;
}

export function SoltarCreditoModal({
  open,
  empresa,
  onClose,
  onSubmit,
}: SoltarCreditoModalProps) {
  const [ganancia, setGanancia] = useState<string>('');
  const [antiguedad, setAntiguedad] = useState<string>('');
  const [plazo, setPlazo] = useState<PlazoCreditoDias>(30);
  const [observacion, setObservacion] = useState<string>('');
  const [evaluacion, setEvaluacion] = useState<EvaluacionCreditoB2BDto | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  useEffect(() => {
    if (open && empresa) {
      setGanancia(empresa.gananciaNetaMensual ? String(empresa.gananciaNetaMensual) : '');
      setAntiguedad(
        empresa.antiguedadEmpresaMeses !== null && empresa.antiguedadEmpresaMeses !== undefined
          ? String(empresa.antiguedadEmpresaMeses)
          : '',
      );
      setPlazo((empresa.plazoCreditoDias as PlazoCreditoDias) || 30);
      setObservacion(empresa.observacionFinanciera ?? '');
      setErrores({});
      setErrorGeneral(null);
      setEvaluacion(null);
    }
  }, [open, empresa]);

  useEffect(() => {
    const val = Number(ganancia);
    if (!open || !Number.isFinite(val) || val <= 0) {
      setEvaluacion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSimulando(true);
      try {
        const ant = antiguedad.trim() !== '' ? Number(antiguedad) : undefined;
        const res = await carterasService.simularCredito({
          gananciaNetaMensual: val,
          antiguedadEmpresaMeses: Number.isFinite(ant) ? ant : undefined,
          plazoCreditoDias: plazo,
        });
        setEvaluacion(res);
      } catch {
        setEvaluacion(null);
      } finally {
        setSimulando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, ganancia, antiguedad, plazo]);

  if (!empresa) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});
    setErrorGeneral(null);

    const parsed = solicitarCreditoB2BSchema.safeParse({
      gananciaNetaMensual: ganancia,
      antiguedadEmpresaMeses: antiguedad,
      plazoCreditoDias: plazo,
      observacionFinanciera: observacion,
    });

    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'general');
        if (!map[key]) map[key] = issue.message;
      }
      setErrores(map);
      return;
    }

    setEnviando(true);
    try {
      await onSubmit(empresa.id, parsed.data);
      onClose();
    } catch (err) {
      setErrorGeneral(
        err instanceof Error ? err.message : 'No se pudo registrar la solicitud de crédito.',
      );
    } finally {
      setEnviando(false);
    }
  };

  const badgeRiesgo = evaluacion ? BADGE_RIESGO[evaluacion.nivelRiesgo] : null;

  return (
    <ModalVidrio
      open={open}
      onClose={onClose}
      locked={enviando}
      title="Soltar crédito corporativo"
      description={`Solicitud financiera para ${empresa.nombreRazonSocial}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {errorGeneral && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300">
            {errorGeneral}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-text-muted font-medium mb-1">
              Ganancia neta mensual (COP) *
            </label>
            <input
              type="number"
              min={1}
              step="10000"
              value={ganancia}
              onChange={(e) => setGanancia(e.target.value)}
              placeholder="Ej. 20000000"
              className="w-full superficie-control rounded-xl px-3 py-2 text-text tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            {errores.gananciaNetaMensual && (
              <p className="text-[11px] text-red-400 mt-1">{errores.gananciaNetaMensual}</p>
            )}
          </div>

          <div>
            <label className="block text-text-muted font-medium mb-1">
              Antigüedad (meses)
            </label>
            <input
              type="number"
              min={0}
              max={1200}
              value={antiguedad}
              onChange={(e) => setAntiguedad(e.target.value)}
              placeholder="Ej. 24"
              className="w-full superficie-control rounded-xl px-3 py-2 text-text tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            {errores.antiguedadEmpresaMeses && (
              <p className="text-[11px] text-red-400 mt-1">{errores.antiguedadEmpresaMeses}</p>
            )}
          </div>

          <div>
            <label className="block text-text-muted font-medium mb-1">Plazo solicitado *</label>
            <select
              value={plazo}
              onChange={(e) => setPlazo(Number(e.target.value) as PlazoCreditoDias)}
              className="w-full superficie-control rounded-xl px-3 py-2 text-text focus:outline-none cursor-pointer"
            >
              {PLAZOS_CREDITO_DIAS.map((d) => (
                <option key={d} value={d} className="bg-bg text-text">
                  {d} días
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-text-muted font-medium mb-1">
            Observación financiera / respaldo
          </label>
          <textarea
            rows={2}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Soporte comercial, comportamiento de pagos o referencias..."
            className="w-full superficie-control rounded-xl px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          {errores.observacionFinanciera && (
            <p className="text-[11px] text-red-400 mt-1">{errores.observacionFinanciera}</p>
          )}
        </div>

        {(simulando || evaluacion) && (
          <div className="vidrio p-4 rounded-xl border border-brand-500/25 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-medium text-text inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Evaluación preliminar de cupo</span>
              </span>
              {simulando ? (
                <span className="text-[11px] text-text-muted inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Simulando...
                </span>
              ) : (
                evaluacion && (
                  <div className="flex items-center gap-1.5">
                    {badgeRiesgo && (
                      <Insignia variante={badgeRiesgo.variante}>{badgeRiesgo.label}</Insignia>
                    )}
                    <Insignia variante={evaluacion.viable ? 'success' : 'danger'}>
                      {evaluacion.viable ? 'Viable' : 'No viable'}
                    </Insignia>
                  </div>
                )
              )}
            </div>
            {evaluacion && (
              <>
                <p className="text-lg font-titulos font-semibold text-text tabular-nums">
                  Cupo sugerido: {formatCOP(evaluacion.cupoSugerido)}
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {evaluacion.justificacion}
                </p>
              </>
            )}
          </div>
        )}

        <p className="text-[11px] text-text-muted">
          La solicitud quedará en estado <span className="font-mono text-text">pendiente_aprobacion</span> hasta que el Super Admin decida habilitar el cupo.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="px-4 py-2 rounded-xl superficie-control text-text-muted hover:text-text font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium disabled:opacity-50 cursor-pointer"
          >
            {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{enviando ? 'Enviando...' : 'Enviar solicitud'}</span>
          </button>
        </div>
      </form>
    </ModalVidrio>
  );
}
