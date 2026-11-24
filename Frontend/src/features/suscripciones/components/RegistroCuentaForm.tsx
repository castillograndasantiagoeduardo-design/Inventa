'use client';

/**
 * RegistroCuentaForm.tsx — Crear una cuenta gratuita (informativa) desde la web.
 * Valida con registroCuentaSchema (@inventa/contracts) y, al crearla, abre la sesión
 * de cuenta y lleva a "Mi cuenta" (o al destino pedido, p. ej. la compra de un plan).
 */

import React, { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { registroCuentaSchema } from '@inventa/contracts';
import { ApiError } from '@/lib/api';
import {
  ALERTA_ERROR,
  BOTON_PRIMARIO,
  CAMPO,
  CAMPO_ERROR,
  ENLACE,
  ERROR_CAMPO,
  ETIQUETA,
  INPUT,
  TITULO,
  TITULO_ACENTO,
} from '@/features/autenticacion/components/auth.estilos';
import { suscripcionesService, rutaLogin } from '../api/suscripciones.service';
import { TarjetaCuenta } from './CuentaShell';

type Campo = 'nombre' | 'email' | 'password' | 'confirmar' | 'aceptaTerminos';

export function RegistroCuentaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const destinoParam = params.get('redirect');
  const destino = destinoParam && destinoParam.startsWith('/') && !destinoParam.startsWith('//') ? destinoParam : '/cuenta';
  const id = useId();

  const [valores, setValores] = useState({ nombre: '', email: '', password: '', confirmar: '', aceptaTerminos: false });
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiar = <K extends keyof typeof valores>(campo: K, valor: (typeof valores)[K]) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);
    const validacion = registroCuentaSchema.safeParse(valores);
    const nuevos: Partial<Record<Campo, string>> = {};
    if (!validacion.success) {
      for (const issue of validacion.error.issues) nuevos[issue.path[0] as Campo] ??= issue.message;
    }
    if (valores.password !== valores.confirmar) nuevos.confirmar = 'Las contraseñas no coinciden.';
    setErrores(nuevos);
    if (!validacion.success || Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await suscripcionesService.registrar(validacion.data);
      router.push(destino);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_YA_REGISTRADO') {
        setErrores({ email: 'Ya existe una cuenta con ese correo. Inicia sesión.' });
      } else {
        setErrorGeneral(error instanceof ApiError ? error.message : 'No se pudo crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const campo = (nombre: Campo) => (errores[nombre] ? CAMPO_ERROR : CAMPO);

  return (
    <TarjetaCuenta>
      <h1 className={`${TITULO} mb-1.5`}>
        Crea tu <span className={TITULO_ACENTO}>cuenta</span>
      </h1>
      <p className="font-sans text-[13px] text-text-muted text-center mb-6">
        Es gratis. Conoce los planes y activa el tuyo cuando quieras.
      </p>

      {errorGeneral && <div role="alert" className={ALERTA_ERROR}>{errorGeneral}</div>}

      <form onSubmit={enviar} noValidate className="space-y-3.5">
        <div>
          <label htmlFor={`${id}-nombre`} className={`${ETIQUETA} mb-1.5`}>Nombre completo</label>
          <div className={campo('nombre')}>
            <input id={`${id}-nombre`} autoComplete="name" value={valores.nombre} onChange={(e) => cambiar('nombre', e.target.value)} className={INPUT} placeholder="Tu nombre" aria-invalid={!!errores.nombre} />
          </div>
          {errores.nombre && <p className={ERROR_CAMPO}>{errores.nombre}</p>}
        </div>

        <div>
          <label htmlFor={`${id}-email`} className={`${ETIQUETA} mb-1.5`}>Correo electrónico</label>
          <div className={campo('email')}>
            <input id={`${id}-email`} type="email" autoComplete="email" value={valores.email} onChange={(e) => cambiar('email', e.target.value)} className={INPUT} placeholder="tu@empresa.com" aria-invalid={!!errores.email} />
          </div>
          {errores.email && <p className={ERROR_CAMPO}>{errores.email}</p>}
        </div>

        <div>
          <label htmlFor={`${id}-password`} className={`${ETIQUETA} mb-1.5`}>Contraseña</label>
          <div className={`flex items-center ${campo('password')}`}>
            <input id={`${id}-password`} type={verClave ? 'text' : 'password'} autoComplete="new-password" value={valores.password} onChange={(e) => cambiar('password', e.target.value)} className={INPUT} placeholder="Mínimo 8 caracteres" aria-invalid={!!errores.password} />
            <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="text-text-muted hover:text-brand-500 ml-2 transition-colors cursor-pointer">
              {verClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errores.password && <p className={ERROR_CAMPO}>{errores.password}</p>}
        </div>

        <div>
          <label htmlFor={`${id}-confirmar`} className={`${ETIQUETA} mb-1.5`}>Confirmar contraseña</label>
          <div className={campo('confirmar')}>
            <input id={`${id}-confirmar`} type={verClave ? 'text' : 'password'} autoComplete="new-password" value={valores.confirmar} onChange={(e) => cambiar('confirmar', e.target.value)} className={INPUT} placeholder="Repite tu contraseña" aria-invalid={!!errores.confirmar} />
          </div>
          {errores.confirmar && <p className={ERROR_CAMPO}>{errores.confirmar}</p>}
        </div>

        <div>
          <label className="flex items-start gap-2 font-sans text-[13px] text-text-muted cursor-pointer select-none">
            <input type="checkbox" checked={valores.aceptaTerminos} onChange={(e) => cambiar('aceptaTerminos', e.target.checked)} className="mt-0.5 size-4 accent-brand-600 cursor-pointer" />
            <span>Acepto los términos y condiciones y la política de tratamiento de datos.</span>
          </label>
          {errores.aceptaTerminos && <p className={ERROR_CAMPO}>{errores.aceptaTerminos}</p>}
        </div>

        <button type="submit" disabled={enviando} className={BOTON_PRIMARIO}>
          {enviando ? (<><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Creando cuenta...</>) : 'Crear cuenta gratis'}
        </button>
      </form>

      <p className="mt-5 text-center font-sans text-[13px] text-text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href={destino === '/cuenta' ? '/acceso' : rutaLogin(destino)} className={ENLACE}>Inicia sesión</Link>
      </p>
    </TarjetaCuenta>
  );
}
