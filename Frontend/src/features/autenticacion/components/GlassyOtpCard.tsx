'use client';

/**
 * GlassyOtpCard.tsx — Tarjeta de recuperación de contraseña con código OTP.
 *
 * Estilo de vidrio + paleta activa (como el panel, la landing y el inicio de sesión):
 * - Tarjeta .vidrio con brillos sutiles de marca y ámbar del logo.
 * - 4 casillas de un dígito con auto-foco, auto-avance, soporte para pegar y auto-verificación al 4to dígito.
 * - Enlace "Reenviar" con temporizador de 60s.
 * - Pantalla de éxito con escudo verde, partículas y "Verificado y seguro".
 * - Paso final de nueva contraseña con revocación de sesiones.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api';
import { EstrellaInventa } from '@/components/panel/EstrellaInventa';
import {
  ALERTA_ERROR,
  BOTON_PRIMARIO,
  CAMPO,
  ENLACE,
  ETIQUETA,
  INPUT,
  TITULO,
  TITULO_ACENTO,
} from './auth.estilos';

/** Ícono de cabecera de cada paso. */
const ICONO_PASO =
  'size-14 mx-auto mb-4 rounded-[14px] bg-brand-500/15 border border-border grid place-items-center text-brand-600 dark:text-brand-300';

/** Subtítulo bajo el título de cada paso. */
const SUBTITULO = 'font-sans text-[13px] text-text-muted leading-relaxed max-w-[330px] mx-auto';

type PasoRecuperacion = 'EMAIL' | 'OTP' | 'VERIFICADO_EXITO' | 'NUEVA_PASSWORD' | 'COMPLETADO';

interface GlassyOtpCardProps {
  emailInicial?: string;
}

export function GlassyOtpCard({ emailInicial = '' }: GlassyOtpCardProps) {
  const router = useRouter();

  // Estados principales
  const [paso, setPaso] = useState<PasoRecuperacion>(emailInicial ? 'OTP' : 'EMAIL');
  const [email, setEmail] = useState<string>(emailInicial);
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);

  // Reenvío con cooldown de 60 segundos
  const [cooldown, setCooldown] = useState<number>(0);

  // Formulario de nueva contraseña
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Refs de inputs OTP
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Temporizador para el cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Foco inicial en la primera casilla cuando entra a OTP
  useEffect(() => {
    if (paso === 'OTP') {
      setTimeout(() => {
        inputRefs[0]?.current?.focus();
      }, 150);
    }
  }, [paso]);

  // Enmascaramiento de email seguro para UI (ej: "a•••@gmail.com")
  const enmascararEmail = (correo: string): string => {
    const partes = correo.split('@');
    if (partes.length !== 2) return correo;
    const [nombre, dominio] = partes;
    const inicio = nombre.slice(0, 1);
    return `${inicio}•••@${dominio}`;
  };

  // ─── 1. Solicitar código OTP ────────────────────────────────────────────────
  const handleSolicitarCodigo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setCooldown(60);
      setDigits(['', '', '', '']);
      setPaso('OTP');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'REENVIO_EN_COOLDOWN') {
          const segs = (err.rawPayload?.segundosRestantes as number) || 60;
          setCooldown(segs);
          setErrorMsg(`Espera ${segs}s antes de solicitar un nuevo código.`);
          setPaso('OTP');
          return;
        }
        setErrorMsg(err.message || 'Error al solicitar el código.');
      } else {
        setErrorMsg('Error de red. Verifica tu conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 2. Auto-verificación al completar el 4to dígito ─────────────────────────
  const verificarCodigo = useCallback(
    async (codigoCompleto: string) => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await apiClient.post<{ resetToken: string }>('/auth/verify-code', {
          email: email.trim(),
          code: codigoCompleto,
        });

        if (res?.resetToken) {
          setResetToken(res.resetToken);
          setPaso('VERIFICADO_EXITO');

          // Transición automática al formulario de nueva contraseña tras ver el estado de éxito
          setTimeout(() => {
            setPaso('NUEVA_PASSWORD');
          }, 2000);
        }
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          const payload = err.rawPayload as { intentosRestantes?: number; segundosRestantes?: number } | undefined;
          if (err.code === 'CODIGO_OTP_BLOQUEADO') {
            setErrorMsg('Has superado los 5 intentos. Código bloqueado. Solicita un nuevo código.');
            setIntentosRestantes(0);
          } else {
            const restantes = payload?.intentosRestantes;
            setIntentosRestantes(restantes ?? null);
            setErrorMsg(
              restantes !== undefined
                ? `Código incorrecto. Te quedan ${restantes} ${restantes === 1 ? 'intento' : 'intentos'}.`
                : err.message || 'Código de verificación incorrecto.',
            );
          }
        } else {
          setErrorMsg('Error al verificar el código.');
        }

        // Limpiar casillas y reenfocar en la primera para corrección rápida
        setDigits(['', '', '', '']);
        setTimeout(() => {
          inputRefs[0]?.current?.focus();
        }, 100);
      } finally {
        setIsLoading(false);
      }
    },
    [email],
  );

  // Manejo de entrada por casilla
  const handleDigitChange = (index: number, val: string) => {
    // Solo permitir números
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal && val !== '') return;

    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      // Manejo de pegado en la casilla individual
      const chars = cleanVal.slice(0, 4).split('');
      chars.forEach((ch, idx) => {
        if (index + idx < 4) {
          newDigits[index + idx] = ch;
        }
      });
      setDigits(newDigits);
      const nextFocus = Math.min(index + chars.length, 3);
      inputRefs[nextFocus]?.current?.focus();

      if (newDigits.every((d) => d !== '')) {
        verificarCodigo(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-avance al siguiente campo
    if (cleanVal && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }

    // Auto-verificación al completar el 4to dígito
    if (newDigits.every((d) => d !== '') && cleanVal) {
      verificarCodigo(newDigits.join(''));
    }
  };

  // Retroceso inteligente con Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs[index - 1]?.current?.focus();
      }
    }
  };

  // Soporte directo para evento Paste en el contenedor
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const newDigits = ['', '', '', ''];
    pasted.split('').forEach((ch, idx) => {
      newDigits[idx] = ch;
    });
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 3);
    inputRefs[nextIndex]?.current?.focus();

    if (pasted.length === 4) {
      verificarCodigo(pasted);
    }
  };

  // ─── 3. Restablecer contraseña final ─────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (!resetToken) {
      setErrorMsg('Token de sesión no disponible. Por favor reinicia el proceso.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });

      setPaso('COMPLETADO');
      setTimeout(() => {
        router.push('/acceso');
      }, 2500);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Error al restablecer la contraseña.');
      } else {
        setErrorMsg('Error de conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto p-1 sm:p-2">
      <div className="vidrio relative overflow-hidden rounded-2xl transition-all duration-500">
        {/* Brillos sutiles de fondo (marca + ámbar del logo) y filo dorado superior */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 -left-20 size-64 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 size-56 rounded-full bg-ambar/[0.08] blur-3xl" />
          <span className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-ambar/60 to-transparent" />
        </div>

        <div className="relative p-7 sm:p-8 z-10">
          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO: EMAIL (Pedir correo si no fue provisto)
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'EMAIL' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-300">
              <div className={ICONO_PASO}>
                <Mail className="size-7" aria-hidden="true" />
              </div>

              <h2 className={`${TITULO} mb-2`}>
                Recuperar <span className={TITULO_ACENTO}>acceso</span>
              </h2>
              <p className={`${SUBTITULO} mb-6`}>
                Ingresa tu correo institucional o asociado a Inventa. Te enviaremos un código OTP de 4 dígitos.
              </p>

              {errorMsg && (
                <div role="alert" className={`${ALERTA_ERROR} text-left`}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSolicitarCodigo} className="space-y-4 text-left">
                <div>
                  <label htmlFor="recuperar-email" className={`${ETIQUETA} mb-1.5`}>
                    Correo electrónico
                  </label>
                  <div className={CAMPO}>
                    <input
                      id="recuperar-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@inventa.local"
                      className={INPUT}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className={BOTON_PRIMARIO}>
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Enviando código...
                    </>
                  ) : (
                    'Continuar con código OTP'
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => router.push('/acceso')}
                  className="font-sans text-[13px] text-text-muted hover:text-text transition-colors cursor-pointer"
                >
                  &larr; Volver a iniciar sesión
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO 1 Y 2: OTP (Casillas, auto-verificación y reenvío)
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'OTP' && (
            <div className="text-center animate-in fade-in duration-300" onPaste={handlePaste}>
              <div className={ICONO_PASO}>
                <Smartphone className="size-7" aria-hidden="true" />
              </div>

              <h2 className={`${TITULO} mb-2`}>
                Verifica tu <span className={TITULO_ACENTO}>correo</span>
              </h2>

              {/* Subtítulo con correo enmascarado */}
              <p className={`${SUBTITULO} mb-6`}>
                Enviamos un código de 4 dígitos a{' '}
                <strong className="font-mono font-medium text-brand-600 dark:text-brand-300">{enmascararEmail(email)}</strong>. Se
                verificará automáticamente al completarlo.
              </p>

              {/* Aviso de error o intentos */}
              {errorMsg && (
                <div role="alert" className={ALERTA_ERROR}>
                  {errorMsg}
                </div>
              )}

              {/* 4 casillas de dígitos unidas por una línea sutil */}
              <div className="relative flex justify-center items-center gap-3 sm:gap-4 my-6">
                <div className="absolute h-px left-6 right-6 bg-gradient-to-r from-transparent via-brand-500/40 to-transparent pointer-events-none" />

                {digits.map((digit, idx) => {
                  const tieneValor = Boolean(digit);
                  return (
                    <div key={idx} className="relative z-10">
                      <input
                        ref={inputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        disabled={isLoading}
                        aria-label={`Dígito ${idx + 1}`}
                        className={`w-14 h-16 sm:w-16 sm:h-[72px] rounded-xl text-center text-2xl sm:text-3xl font-mono font-semibold transition-all duration-200 outline-none select-all ${
                          tieneValor
                            ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border-2 border-brand-500 shadow-lg shadow-brand-500/20'
                            : 'superficie-control text-text border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25'
                        } ${isLoading ? 'opacity-60 animate-pulse' : ''}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Reenviar con cuenta regresiva */}
              <div className="mt-6 font-sans text-[13px] text-text-muted">
                <span>¿No recibiste el código? </span>
                {cooldown > 0 ? (
                  <span className="font-medium text-brand-600 dark:text-brand-300 tabular-nums">Reenviar en {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSolicitarCodigo()}
                    disabled={isLoading}
                    className={`${ENLACE} font-medium underline cursor-pointer disabled:opacity-50`}
                  >
                    Reenviar
                  </button>
                )}
              </div>

              {/* Botón para cambiar email */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPaso('EMAIL');
                    setDigits(['', '', '', '']);
                    setErrorMsg(null);
                  }}
                  className="font-sans text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
                >
                  Cambiar correo electrónico
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO 3: ÉXITO ("Verificado correctamente" + partículas)
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'VERIFICADO_EXITO' && (
            <div className="relative text-center py-4 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
              {/* Partículas flotando (incluye la estrella ámbar del logo) */}
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <span className="absolute top-2 left-8 size-2 rounded-full bg-green-400 animate-ping" />
                <span className="absolute top-8 right-10 size-2.5 bg-brand-400 rotate-45 animate-bounce" />
                <span className="absolute bottom-6 left-12 animate-pulse">
                  <EstrellaInventa className="size-3" />
                </span>
                <span className="absolute top-1/2 right-6 w-3 h-1.5 bg-green-300 rotate-12" />
                <span className="absolute bottom-10 right-14 size-2 rounded-full bg-text-muted/60" />
              </div>

              {/* Escudo verde con check */}
              <div className="size-16 mx-auto mb-4 rounded-[14px] bg-green-500/12 border-2 border-green-500 grid place-items-center text-green-600 dark:text-green-300 shadow-lg shadow-green-500/25 animate-in zoom-in-50 duration-300">
                <ShieldCheck className="size-9" aria-hidden="true" />
              </div>

              <h2 className={`${TITULO} mb-2`}>
                Verificado <span className="text-green-600 dark:text-green-300">correctamente</span>
              </h2>

              <p className={`${SUBTITULO} mb-6`}>
                Tu identidad ha sido confirmada. Todo listo para restablecer tu contraseña.
              </p>

              <div className="w-20 h-12 mx-auto rounded-xl bg-green-500/12 border border-green-500/40 flex items-center justify-center text-green-600 dark:text-green-300 mb-6">
                <Check className="size-6" strokeWidth={3} aria-hidden="true" />
              </div>

              <div className="flex items-center justify-center gap-1.5 font-sans text-[13px] font-medium text-green-600 dark:text-green-300">
                <Lock className="size-3.5" aria-hidden="true" />
                <span>Verificado y seguro</span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO 4: NUEVA CONTRASEÑA
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'NUEVA_PASSWORD' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 text-left">
              <div className={`${ICONO_PASO} !size-12 !mb-3`}>
                <KeyRound className="size-6" aria-hidden="true" />
              </div>

              <h2 className={`${TITULO} mb-1`}>
                Nueva <span className={TITULO_ACENTO}>contraseña</span>
              </h2>
              <p className={`${SUBTITULO} text-center mb-5`}>
                Ingresa y confirma tu nueva clave. Al cambiarla, todas tus sesiones activas se cerrarán.
              </p>

              {errorMsg && (
                <div role="alert" className={ALERTA_ERROR}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="nueva-password" className={`${ETIQUETA} mb-1.5`}>
                    Nueva contraseña
                  </label>
                  <div className={`flex items-center ${CAMPO}`}>
                    <input
                      id="nueva-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={128}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className={INPUT}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="text-text-muted hover:text-brand-500 ml-2 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmar-password" className={`${ETIQUETA} mb-1.5`}>
                    Confirmar contraseña
                  </label>
                  <div className={CAMPO}>
                    <input
                      id="confirmar-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={128}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className={INPUT}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className={`${BOTON_PRIMARIO} mt-2`}>
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Actualizando contraseña...
                    </>
                  ) : (
                    'Guardar y cerrar sesiones'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ESTADO 5: COMPLETADO
             ═══════════════════════════════════════════════════════════════════ */}
          {paso === 'COMPLETADO' && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-400">
              <div className="size-14 mx-auto mb-3 rounded-full bg-green-500/15 text-green-600 dark:text-green-300 grid place-items-center">
                <Check className="size-7" strokeWidth={3} aria-hidden="true" />
              </div>
              <h3 className={`${TITULO} !text-2xl mb-2`}>
                ¡Contraseña <span className="text-green-600 dark:text-green-300">restablecida!</span>
              </h3>
              <p className={SUBTITULO}>
                Tu contraseña ha sido actualizada y tus sesiones previas revocadas. Redirigiendo al inicio de sesión...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
