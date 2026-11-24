'use client';

/**
 * PasarelaSimuladaView.tsx — Página de la pasarela de pagos de DEMOSTRACIÓN.
 * No hay cobros reales. Tarjetas de prueba: 4242 4242 4242 4242 (aprobada) y
 * 4000 0000 0000 0002 (rechazada). El número completo nunca se guarda.
 */

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, FlaskConical, Loader2, Lock } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { formatCOP } from '@/lib/format/moneda';
import {
  ALERTA_ERROR, BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO, CAJA_INFO, ENLACE, ETIQUETA, INPUT, TITULO,
} from '@/features/autenticacion/components/auth.estilos';
import { suscripcionesService, rutaLogin, type PagoConsultado } from '../api/suscripciones.service';
import { TarjetaCuenta } from './CuentaShell';

const TARJETAS_PRUEBA = [
  { numero: '4242 4242 4242 4242', resultado: 'Aprobada' },
  { numero: '4000 0000 0000 0002', resultado: 'Rechazada' },
];

const agrupar = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatoVencimiento = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function PasarelaSimuladaView() {
  const router = useRouter();
  const referencia = useSearchParams().get('ref') ?? '';
  const id = useId();
  const [pago, setPago] = useState<PagoConsultado | null>(null);
  const [tarjeta, setTarjeta] = useState({ numero: '', titular: '', vencimiento: '', cvv: '' });
  const [error, setError] = useState<string | null>(null);
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let vivo = true;
    suscripcionesService.consultarPago(referencia)
      .then((p) => {
        if (!vivo) return;
        if (p.estado !== 'pendiente') router.replace(`/pago/resultado?ref=${encodeURIComponent(referencia)}`);
        else setPago(p);
      })
      .catch((err) => {
        if (!vivo) return;
        if (err instanceof ApiError && err.status === 401) router.replace(rutaLogin(`/pago/simulado?ref=${encodeURIComponent(referencia)}`));
        else setError('No encontramos este pago.');
      });
    return () => { vivo = false; };
  }, [referencia, router]);

  const pagar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcesando(true);
    try {
      const r = await suscripcionesService.pagarSimulado(referencia, tarjeta);
      if (r.estado === 'rechazado') {
        setRechazo(r.motivo ?? 'La transacción fue rechazada.');
        setProcesando(false);
        return;
      }
      router.push(`/pago/resultado?ref=${encodeURIComponent(referencia)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo procesar el pago.');
      setProcesando(false);
    }
  };

  if (!pago) {
    return error
      ? <TarjetaCuenta><p role="alert" className="text-sm text-text-muted text-center">{error} <Link href="/cuenta" className={ENLACE}>Volver a mi cuenta</Link></p></TarjetaCuenta>
      : <p className="flex items-center gap-2 text-sm text-text-muted" role="status"><Loader2 className="size-4 animate-spin" /> Conectando con la pasarela...</p>;
  }

  return (
    <TarjetaCuenta ancho="max-w-[480px]">
      <div role="note" className="mb-5 flex items-start gap-2 rounded-[10px] px-3.5 py-2.5 bg-amber-50 text-amber-800 dark:bg-amber-500/12 dark:text-amber-300 ring-1 ring-inset ring-amber-600/25 text-xs">
        <FlaskConical className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span><strong className="font-semibold">Pasarela de pagos simulada.</strong> No se realizan cobros reales.</span>
      </div>

      <h1 className={`${TITULO} mb-1`}>Pagar {formatCOP(pago.montoCentavos / 100)}</h1>
      <p className="text-center text-[13px] text-text-muted mb-5">
        Plan {pago.plan.nombre} · {pago.plan.diasVigencia} días · Ref. <span className="font-mono">{pago.referencia}</span>
      </p>

      {rechazo ? (
        <div className="space-y-4">
          <div role="alert" className={ALERTA_ERROR}>
            <strong className="font-semibold">Pago rechazado.</strong> {rechazo}
          </div>
          <Link href={`/cuenta/comprar?plan=${pago.plan.id}`} className={BOTON_PRIMARIO}>Intentar con otra tarjeta</Link>
          <Link href="/cuenta" className={`${BOTON_SECUNDARIO} flex items-center justify-center`}>Volver a mi cuenta</Link>
        </div>
      ) : (
        <>
          {error && <div role="alert" className={ALERTA_ERROR}>{error}</div>}
          <form onSubmit={pagar} className="space-y-3.5">
            <div>
              <label htmlFor={`${id}-numero`} className={`${ETIQUETA} mb-1.5`}>Número de tarjeta</label>
              <div className={`flex items-center ${CAMPO}`}>
                <CreditCard className="size-4 text-text-muted mr-2" aria-hidden="true" />
                <input id={`${id}-numero`} inputMode="numeric" autoComplete="cc-number" value={tarjeta.numero} onChange={(e) => setTarjeta((t) => ({ ...t, numero: agrupar(e.target.value) }))} className={`${INPUT} font-mono tracking-wider`} placeholder="0000 0000 0000 0000" />
              </div>
            </div>
            <div>
              <label htmlFor={`${id}-titular`} className={`${ETIQUETA} mb-1.5`}>Nombre del titular</label>
              <div className={CAMPO}>
                <input id={`${id}-titular`} autoComplete="cc-name" value={tarjeta.titular} onChange={(e) => setTarjeta((t) => ({ ...t, titular: e.target.value }))} className={INPUT} placeholder="Como aparece en la tarjeta" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${id}-venc`} className={`${ETIQUETA} mb-1.5`}>Vencimiento</label>
                <div className={CAMPO}>
                  <input id={`${id}-venc`} inputMode="numeric" autoComplete="cc-exp" value={tarjeta.vencimiento} onChange={(e) => setTarjeta((t) => ({ ...t, vencimiento: formatoVencimiento(e.target.value) }))} className={`${INPUT} font-mono`} placeholder="MM/AA" />
                </div>
              </div>
              <div>
                <label htmlFor={`${id}-cvv`} className={`${ETIQUETA} mb-1.5`}>CVV</label>
                <div className={CAMPO}>
                  <input id={`${id}-cvv`} inputMode="numeric" autoComplete="cc-csc" type="password" value={tarjeta.cvv} onChange={(e) => setTarjeta((t) => ({ ...t, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} className={`${INPUT} font-mono`} placeholder="123" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={procesando} className={BOTON_PRIMARIO}>
              {procesando ? (<><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Procesando pago...</>) : (<><Lock className="size-4" aria-hidden="true" /> Pagar {formatCOP(pago.montoCentavos / 100)}</>)}
            </button>
          </form>

          <div className={`${CAJA_INFO} mt-5`}>
            <p className="font-medium text-text mb-2">Tarjetas de prueba</p>
            <ul className="space-y-1.5">
              {TARJETAS_PRUEBA.map((t) => (
                <li key={t.numero} className="flex items-center justify-between gap-2">
                  <span><span className="font-mono">{t.numero}</span> · {t.resultado}</span>
                  <button
                    type="button"
                    onClick={() => setTarjeta({ numero: t.numero, titular: 'Cliente de prueba', vencimiento: '12/30', cvv: '123' })}
                    className={`${ENLACE} cursor-pointer`}
                  >
                    Usar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </TarjetaCuenta>
  );
}
