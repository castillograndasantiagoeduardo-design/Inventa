'use client';

/**
 * TwoFactorStep.tsx — Paso de verificación de segundo factor (2FA TOTP RFC 6238).
 *
 * Principio SOLID:
 * - Single Responsibility: Controla la vista interactiva para el código de 6 dígitos
 *   cuando el backend devuelve HTTP 428 (REQUIERE_2FA).
 */

import React, { useId } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useTwoFactorForm } from '../hooks/useTwoFactorForm';
import { RateLimitNotice } from './RateLimitNotice';
import { BOTON_PRIMARIO, CAMPO, ETIQUETA, TITULO, TITULO_ACENTO } from './auth.estilos';

interface TwoFactorStepProps {
  onSuccess?: () => void;
}

export function TwoFactorStep({ onSuccess }: TwoFactorStepProps) {
  const totpInputId = useId();
  const {
    codigoTotp,
    error,
    isSubmitting,
    rateLimit,
    mensajeInstruccion,
    handleCodigoChange,
    handleSubmit,
    cancelar,
  } = useTwoFactorForm();

  return (
    <div className="w-full max-w-[320px] mx-auto py-2 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-4">
        {/* Ícono de Escudo 2FA */}
        <div className="size-12 mx-auto mb-3 rounded-[12px] bg-brand-500/15 border border-border grid place-items-center text-brand-600 dark:text-brand-300">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </div>

        <h2 className={TITULO}>
          Segundo <span className={TITULO_ACENTO}>factor</span>
        </h2>
        <p className="font-sans text-[13px] text-text-muted leading-relaxed mt-1.5">
          {mensajeInstruccion ||
            'Ingresa el código de 6 dígitos generado por tu aplicación autenticadora (Google Authenticator, Authy o Microsoft Authenticator).'}
        </p>
      </div>

      {rateLimit.bloqueado && (
        <RateLimitNotice
          mensaje={rateLimit.mensaje}
          tiempoRestanteSegundos={rateLimit.tiempoRestanteSegundos}
        />
      )}

      <form onSubmit={(e) => handleSubmit(e, onSuccess)} noValidate className="space-y-4">
        <div>
          <label htmlFor={totpInputId} className={`${ETIQUETA} text-center mb-1.5`}>
            Código de 6 dígitos
          </label>
          <div className={`${CAMPO} !px-4 !py-3`}>
            <input
              id={totpInputId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigoTotp}
              onChange={(e) => handleCodigoChange(e.target.value)}
              placeholder="000000"
              autoFocus
              disabled={isSubmitting || rateLimit.bloqueado}
              className="w-full bg-transparent text-center font-mono text-2xl font-semibold tracking-[0.45em] text-brand-600 dark:text-brand-300 placeholder:text-text-muted/40 focus:outline-none"
            />
          </div>

          {error && (
            <p className="font-sans text-xs text-red-600 dark:text-red-400 text-center mt-2 animate-shake">{error}</p>
          )}
        </div>

        {/* Botón Primario de Validación */}
        <button
          type="submit"
          disabled={isSubmitting || rateLimit.bloqueado || codigoTotp.length !== 6}
          className={BOTON_PRIMARIO}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Verificando...</span>
            </>
          ) : (
            <span>Verificar código</span>
          )}
        </button>

        {/* Botón Secundario: Cancelar y volver al inicio de sesión */}
        <button
          type="button"
          onClick={cancelar}
          disabled={isSubmitting}
          className="w-full text-center font-sans text-[13px] text-text-muted hover:text-text transition-colors cursor-pointer py-1"
        >
          &larr; Volver al inicio de sesión
        </button>
      </form>
    </div>
  );
}
