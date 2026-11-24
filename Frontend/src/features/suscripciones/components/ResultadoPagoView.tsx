'use client';

/**
 * ResultadoPagoView.tsx — Resultado del pago. Confirma con el backend (que reconsulta
 * la pasarela y activa el plan de forma idempotente) y lleva al panel si fue aprobado.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Loader2, RotateCw, X } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, TITULO } from '@/features/autenticacion/components/auth.estilos';
import { suscripcionesService, rutaLogin, type PagoConsultado, type ResultadoPago } from '../api/suscripciones.service';
import { TarjetaCuenta } from './CuentaShell';

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export function ResultadoPagoView() {
  const router = useRouter();
  const referencia = useSearchParams().get('ref') ?? '';
  const [pago, setPago] = useState<PagoConsultado | null>(null);
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const confirmar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const p = await suscripcionesService.consultarPago(referencia);
      setPago(p);
      // Pendiente o aprobado: el backend reconsulta la pasarela y activa (sin duplicar).
      setResultado(p.estado === 'rechazado' || p.estado === 'expirado'
        ? { referencia, estado: p.estado, empresaId: null, venceEn: null, motivo: p.motivoRechazo }
        : await suscripcionesService.confirmarPago(referencia));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(rutaLogin(`/pago/resultado?ref=${encodeURIComponent(referencia)}`));
        return;
      }
      setError(err instanceof ApiError ? err.message : 'No pudimos confirmar el pago.');
    } finally {
      setCargando(false);
    }
  }, [referencia, router]);

  useEffect(() => { void confirmar(); }, [confirmar]);

  if (cargando) {
    return <p className="flex items-center gap-2 text-sm text-text-muted" role="status"><Loader2 className="size-4 animate-spin" /> Confirmando tu pago...</p>;
  }

  if (error) {
    return (
      <TarjetaCuenta>
        <h1 className={`${TITULO} mb-3`}>No pudimos terminar</h1>
        <p role="alert" className="text-sm text-text-muted text-center mb-5">{error}</p>
        <button type="button" onClick={() => void confirmar()} className={BOTON_PRIMARIO}><RotateCw className="size-4" aria-hidden="true" /> Reintentar</button>
      </TarjetaCuenta>
    );
  }

  if (resultado?.estado === 'aprobado') {
    return (
      <TarjetaCuenta>
        <div className="size-14 mx-auto mb-4 rounded-full bg-green-500/15 text-green-600 dark:text-green-300 grid place-items-center">
          <Check className="size-7" strokeWidth={3} aria-hidden="true" />
        </div>
        <h1 className={`${TITULO} mb-2`}>¡Pago aprobado!</h1>
        <p className="text-center text-sm text-text-muted mb-6">
          Tu plan <strong className="font-semibold text-text">{pago?.plan.nombre}</strong> está activo
          {resultado.venceEn ? <> hasta el <span className="tabular-nums">{fecha(resultado.venceEn)}</span></> : null}.
        </p>
        {/* Navegación completa: carga la sesión del panel abierta tras el pago. */}
        <a href="/dashboard" className={BOTON_PRIMARIO}>Ir a mi panel <ArrowRight className="size-4" aria-hidden="true" /></a>
        <Link href="/cuenta" className={`${BOTON_SECUNDARIO} mt-3 flex items-center justify-center`}>Ver mi cuenta</Link>
      </TarjetaCuenta>
    );
  }

  if (resultado?.estado === 'pendiente') {
    return (
      <TarjetaCuenta>
        <h1 className={`${TITULO} mb-2`}>Pago en proceso</h1>
        <p className="text-center text-sm text-text-muted mb-5">La pasarela aún no confirma el pago. Vuelve a consultar en un momento.</p>
        <button type="button" onClick={() => void confirmar()} className={BOTON_PRIMARIO}><RotateCw className="size-4" aria-hidden="true" /> Consultar de nuevo</button>
      </TarjetaCuenta>
    );
  }

  return (
    <TarjetaCuenta>
      <div className="size-14 mx-auto mb-4 rounded-full bg-red-500/15 text-red-600 dark:text-red-300 grid place-items-center">
        <X className="size-7" strokeWidth={3} aria-hidden="true" />
      </div>
      <h1 className={`${TITULO} mb-2`}>Pago rechazado</h1>
      <p className="text-center text-sm text-text-muted mb-6">{resultado?.motivo ?? 'La transacción no fue aprobada.'} No se hizo ningún cobro.</p>
      {pago && <Link href={`/cuenta/comprar?plan=${pago.plan.id}`} className={BOTON_PRIMARIO}>Intentar de nuevo</Link>}
      <Link href="/cuenta" className={`${BOTON_SECUNDARIO} mt-3 flex items-center justify-center`}>Volver a mi cuenta</Link>
    </TarjetaCuenta>
  );
}
