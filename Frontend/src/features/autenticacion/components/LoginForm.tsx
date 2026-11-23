'use client';

/**
 * LoginForm.tsx — Formulario de inicio de sesión (vidrio + paleta activa) con conexión a backend.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Encapsula exclusivamente la captura de credenciales y feedback visual.
 * - Single Source of Truth: La validación corre a través del hook useLoginForm con loginSchema de Zod.
 */

import React, { useId } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';
import { SocialAuthButtons } from './SocialAuthButtons';
import { RateLimitNotice } from './RateLimitNotice';
import type { LoginResult } from '../types/auth.types';
import {
  ALERTA_ERROR,
  BOTON_PRIMARIO,
  CAMPO,
  CAMPO_ERROR,
  ENLACE,
  ERROR_CAMPO,
  ETIQUETA,
  INPUT,
  SEPARADOR,
  TITULO,
  TITULO_ACENTO,
} from './auth.estilos';

interface LoginFormProps {
  isMobile?: boolean;
  onSuccess?: (resultado: LoginResult) => void;
  onForgotPasswordClick?: () => void;
}

export function LoginForm({
  isMobile = false,
  onSuccess,
  onForgotPasswordClick,
}: LoginFormProps) {
  const emailInputId = useId();
  const passwordInputId = useId();
  const rememberCheckboxId = useId();

  const {
    values,
    errors,
    errorGeneral,
    isSubmitting,
    showPassword,
    rateLimit,
    setShowPassword,
    setCampo,
    handleSubmit,
  } = useLoginForm();

  const handleRecuperarPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onForgotPasswordClick) {
      onForgotPasswordClick();
    } else {
      alert('Para restablecer tu contraseña, contacta al administrador de tu sucursal o escribe a soporte@warengine.com.');
    }
  };

  return (
    <div className={`w-full ${isMobile ? 'max-w-[340px]' : 'max-w-[300px]'} mx-auto`}>
      <h1 className={`${TITULO} mb-4`}>
        Iniciar <span className={TITULO_ACENTO}>sesión</span>
      </h1>

      {/* Botones de proveedores sociales */}
      <SocialAuthButtons />

      <p className={SEPARADOR}>o usa tu correo institucional</p>

      {/* Aviso de Bloqueo por Fuerza Bruta (429) */}
      {rateLimit.bloqueado && (
        <RateLimitNotice
          mensaje={rateLimit.mensaje}
          tiempoRestanteSegundos={rateLimit.tiempoRestanteSegundos}
        />
      )}

      {/* Error General de API (ej. credenciales inválidas o cuenta inactiva) */}
      {errorGeneral && !rateLimit.bloqueado && (
        <div role="alert" className={ALERTA_ERROR}>
          {errorGeneral}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, onSuccess)} noValidate className="space-y-3.5">
        {/* Campo Email */}
        <div>
          <label htmlFor={emailInputId} className={`${ETIQUETA} mb-1.5`}>
            Correo electrónico
          </label>
          <div className={errors.email ? CAMPO_ERROR : CAMPO}>
            <input
              id={emailInputId}
              type="email"
              value={values.email}
              onChange={(e) => setCampo('email', e.target.value)}
              placeholder="usuario@empresa.com"
              autoComplete="email"
              disabled={isSubmitting || rateLimit.bloqueado}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? `${emailInputId}-error` : undefined}
              className={INPUT}
            />
          </div>
          {errors.email && (
            <p id={`${emailInputId}-error`} className={ERROR_CAMPO}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Campo Contraseña */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={passwordInputId} className={ETIQUETA}>
              Contraseña
            </label>
            <a href="#recuperar" onClick={handleRecuperarPassword} className={`${ENLACE} !text-xs`}>
              ¿Olvidaste?
            </a>
          </div>
          <div className={`flex items-center ${errors.password ? CAMPO_ERROR : CAMPO}`}>
            <input
              id={passwordInputId}
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(e) => setCampo('password', e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting || rateLimit.bloqueado}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? `${passwordInputId}-error` : undefined}
              className={INPUT}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="text-text-muted hover:text-brand-500 ml-2 transition-colors focus-visible:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p id={`${passwordInputId}-error`} className={ERROR_CAMPO}>
              {errors.password}
            </p>
          )}
        </div>

        {/* Fila: Recordarme y Enlace Olvidé Contraseña */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            <input
              id={rememberCheckboxId}
              type="checkbox"
              checked={values.recordarme}
              onChange={(e) => setCampo('recordarme', e.target.checked)}
              disabled={isSubmitting || rateLimit.bloqueado}
              className="size-4 rounded border-border accent-brand-600 cursor-pointer"
            />
            <label
              htmlFor={rememberCheckboxId}
              className="font-sans text-[13px] text-text-muted select-none cursor-pointer hover:text-text transition-colors"
            >
              Recordar (30 días)
            </label>
          </div>

          <a href="/recuperar-password" className={ENLACE}>
            ¿Olvidaste tu clave?
          </a>
        </div>

        {/* Botón primario con spinner */}
        <div className="pt-2">
          <button type="submit" disabled={isSubmitting || rateLimit.bloqueado} className={BOTON_PRIMARIO}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Ingresar al sistema</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
