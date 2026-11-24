'use client';

/**
 * CheckoutView.tsx — Resumen de compra de un plan. En la primera compra pide el nombre
 * de la empresa (se crea con el pago). El monto lo fija el servidor; aquí solo se muestra.
 */

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { PlanDto } from '@inventa/contracts';
import { ApiError } from '@/lib/api';
import { formatCOP } from '@/lib/format/moneda';
import {
  ALERTA_ERROR, BOTON_PRIMARIO, CAMPO, CAJA_INFO, ENLACE, ETIQUETA, INPUT, TITULO, TITULO_ACENTO,
} from '@/features/autenticacion/components/auth.estilos';
import { suscripcionesService, rutaInterna, rutaLogin, type MiCuenta } from '../api/suscripciones.service';
import { TarjetaCuenta } from './CuentaShell';

export function CheckoutView() {
  const router = useRouter();
  const planId = useSearchParams().get('plan') ?? '';
  const id = useId();
  const [cuenta, setCuenta] = useState<MiCuenta | null>(null);
  const [plan, setPlan] = useState<PlanDto | null | undefined>(undefined);
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nit, setNit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [mia, planes] = await Promise.all([suscripcionesService.miCuenta(), suscripcionesService.obtenerPlanes()]);
      if (!vivo) return;
      if (!mia) {
        // Comprar sin sesión → iniciar sesión (o crear cuenta) y volver aquí.
        router.replace(rutaLogin(`/cuenta/comprar?plan=${encodeURIComponent(planId)}`));
        return;
      }
      setCuenta(mia);
      setPlan(planes.find((p) => p.id === planId) ?? null);
    })().catch(() => vivo && setError('No pudimos cargar el plan. Intenta de nuevo.'));
    return () => { vivo = false; };
  }, [planId, router]);

  const primeraCompra = cuenta?.cuenta.empresaId === null;

  const pagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    if (primeraCompra && nombreEmpresa.trim().length < 3) {
      setError('Escribe el nombre de tu empresa (mínimo 3 caracteres).');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const checkout = await suscripcionesService.iniciarCheckout({
        planId: plan.id as 'almacen' | 'tienda' | 'empresario',
        ...(primeraCompra ? { nombreEmpresa: nombreEmpresa.trim(), nit: nit.trim() || undefined } : {}),
      });
      router.push(rutaInterna(checkout.urlPago));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar el pago.');
      setEnviando(false);
    }
  };

  if (plan === undefined && !error) {
    return <p className="flex items-center gap-2 text-sm text-text-muted" role="status"><Loader2 className="size-4 animate-spin" /> Preparando tu compra...</p>;
  }

  if (plan === null) {
    return (
      <TarjetaCuenta>
        <p className="text-sm text-text-muted text-center">Ese plan no existe. <Link href="/cuenta" className={ENLACE}>Ver planes</Link></p>
      </TarjetaCuenta>
    );
  }

  const suscripcion = cuenta?.suscripcion;
  const efecto = !suscripcion
    ? 'Al aprobarse el pago crearemos tu empresa y entrarás directo a tu panel.'
    : suscripcion.planId === plan?.id
      ? 'Los 30 días se suman al final de tu periodo actual.'
      : `Tu plan cambia a ${plan?.nombre} desde hoy, por 30 días.`;

  return (
    <TarjetaCuenta>
      <h1 className={`${TITULO} mb-1.5`}>
        {suscripcion?.planId === plan?.id ? 'Renovar' : 'Comprar'} plan <span className={TITULO_ACENTO}>{plan?.nombre}</span>
      </h1>
      <p className="text-center text-[13px] text-text-muted mb-6">{efecto}</p>

      <dl className={`${CAJA_INFO} grid grid-cols-2 gap-y-2 mb-5`}>
        <dt>Plan</dt><dd className="text-right text-text font-medium">{plan?.nombre}</dd>
        <dt>Vigencia</dt><dd className="text-right text-text tabular-nums">{plan?.diasVigencia} días</dd>
        <dt className="font-medium text-text">Total</dt>
        <dd className="text-right font-titulos text-lg font-semibold text-text tabular-nums">{plan ? formatCOP(plan.precioCentavos / 100) : ''}</dd>
      </dl>

      {error && <div role="alert" className={ALERTA_ERROR}>{error}</div>}

      <form onSubmit={pagar} className="space-y-3.5">
        {primeraCompra && (
          <>
            <div>
              <label htmlFor={`${id}-empresa`} className={`${ETIQUETA} mb-1.5`}>Nombre de tu empresa</label>
              <div className={CAMPO}>
                <input id={`${id}-empresa`} value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)} className={INPUT} placeholder="Ej. Ferretería El Tornillo" maxLength={150} />
              </div>
            </div>
            <div>
              <label htmlFor={`${id}-nit`} className={`${ETIQUETA} mb-1.5`}>NIT (opcional)</label>
              <div className={CAMPO}>
                <input id={`${id}-nit`} value={nit} onChange={(e) => setNit(e.target.value)} className={INPUT} placeholder="900123456-1" maxLength={30} />
              </div>
            </div>
          </>
        )}
        <button type="submit" disabled={enviando} className={BOTON_PRIMARIO}>
          {enviando ? (<><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Abriendo la pasarela...</>) : 'Ir a pagar'}
        </button>
      </form>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted">
        <ShieldCheck className="size-3.5 text-brand-500" aria-hidden="true" /> Pago seguro · <Link href="/cuenta" className={ENLACE}>Volver a mi cuenta</Link>
      </p>
    </TarjetaCuenta>
  );
}
