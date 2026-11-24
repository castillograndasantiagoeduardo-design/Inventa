'use client';

/**
 * MiCuentaView.tsx — "Mi cuenta": estado de la suscripción y planes disponibles.
 * Cuenta gratuita → solo ve planes y puede comprar. Con plan → puede renovar,
 * cambiar de plan o ir a su panel.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, LogOut, Loader2 } from 'lucide-react';
import type { PlanDto } from '@inventa/contracts';
import { Insignia } from '@/components/Insignia';
import { EstrellaInventa } from '@/components/panel/EstrellaInventa';
import { formatCOP } from '@/lib/format/moneda';
import { PLANES } from '@/features/landing/data/planes.data';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, TITULO_ACENTO } from '@/features/autenticacion/components/auth.estilos';
import { suscripcionesService, rutaLogin, type MiCuenta } from '../api/suscripciones.service';
import { MarcaCuentaCard } from './MarcaCuentaCard';

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export function MiCuentaView() {
  const router = useRouter();
  const [datos, setDatos] = useState<MiCuenta | null>(null);
  const [planes, setPlanes] = useState<PlanDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [mia, catalogo] = await Promise.all([suscripcionesService.miCuenta(), suscripcionesService.obtenerPlanes()]);
        if (!vivo) return;
        if (!mia) {
          router.replace(rutaLogin('/cuenta'));
          return;
        }
        setDatos(mia);
        setPlanes(catalogo);
      } catch {
        if (vivo) setError('No pudimos cargar tu cuenta. Intenta de nuevo en un momento.');
      }
    })();
    return () => { vivo = false; };
  }, [router]);

  const salir = async () => {
    await suscripcionesService.cerrarSesion().catch(() => null);
    router.push('/');
  };

  if (error) return <p role="alert" className="vidrio rounded-2xl p-6 text-sm text-text-muted">{error}</p>;
  if (!datos) {
    return (
      <p className="flex items-center gap-2 text-sm text-text-muted" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando tu cuenta...
      </p>
    );
  }

  const { cuenta, suscripcion } = datos;
  const accion = (planId: string) =>
    !suscripcion ? 'Comprar' : suscripcion.planId === planId ? 'Renovar 30 días' : 'Cambiar a este plan';

  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-8">
      {/* Encabezado de la cuenta */}
      <section className="vidrio rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-brand-600 dark:text-brand-300">
            <EstrellaInventa /> Mi cuenta
          </span>
          <h1 className="font-titulos text-2xl sm:text-[28px] font-semibold tracking-[-0.005em] text-text">
            Hola, <span className={TITULO_ACENTO}>{cuenta.nombre.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-text-muted">{cuenta.email}</p>
          {suscripcion ? (
            <p className="text-sm text-text">
              Plan <strong className="font-semibold">{suscripcion.planNombre}</strong> activo hasta el{' '}
              <span className="tabular-nums">{fecha(suscripcion.venceEn)}</span>.
            </p>
          ) : (
            <p className="text-sm text-text">
              Tu cuenta es <strong className="font-semibold">gratuita</strong>: elige un plan para crear tu empresa y empezar a operar.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {cuenta.empresaId !== null && (
            // Navegación completa: recarga la sesión del panel que abrió el login o el pago.
            <a href="/dashboard" className={`${BOTON_PRIMARIO} !w-auto`}>
              Ir a mi panel <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          )}
          <button type="button" onClick={salir} className={`${BOTON_SECUNDARIO} inline-flex items-center gap-2`}>
            <LogOut className="size-4" aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </section>

      <MarcaCuentaCard
        colorPrincipal={cuenta.colorPrincipal ?? null}
        logoVersion={cuenta.logoVersion ?? null}
        onCambio={(marca) => setDatos((d) => d && { ...d, cuenta: { ...d.cuenta, ...marca } })}
      />

      {/* Planes */}
      <section aria-labelledby="planes-cuenta" className="flex flex-col gap-5">
        <h2 id="planes-cuenta" className="font-titulos text-xl font-semibold text-text">
          {suscripcion ? 'Renueva o cambia tu plan' : 'Elige tu plan'}
        </h2>
        <ul className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {planes.map((plan) => {
            const actual = suscripcion?.planId === plan.id;
            const extra = PLANES.find((p) => p.id === plan.id);
            return (
              <li key={plan.id} className={`vidrio relative p-7 flex flex-col gap-5 ${actual ? '!border-brand-500 !bg-brand-500/10' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-titulos text-lg font-semibold text-text">{plan.nombre}</h3>
                  <Insignia variante="brand" conPunto>{actual ? 'Tu plan' : plan.etiqueta}</Insignia>
                </div>
                <p className="flex items-baseline gap-1.5">
                  <span className="font-titulos text-[36px] leading-[44px] font-semibold text-text tabular-nums">
                    {formatCOP(plan.precioCentavos / 100)}
                  </span>
                  <span className="text-[13px] text-text-muted">/ {plan.diasVigencia} días</span>
                </p>
                <p className="text-[13px] leading-5 text-text-muted">{plan.descripcion}</p>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {(extra?.caracteristicas ?? []).map((c) => (
                    <li key={c} className="flex items-center gap-2.5 text-[13px] text-text">
                      <Check className="size-4 shrink-0 text-brand-500" aria-hidden="true" /> {c}
                    </li>
                  ))}
                </ul>
                <Link href={`/cuenta/comprar?plan=${plan.id}`} className={actual || !suscripcion ? BOTON_PRIMARIO : `${BOTON_SECUNDARIO} text-center`}>
                  {accion(plan.id)}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
