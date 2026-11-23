'use client';

/**
 * AuthCard.tsx — Tarjeta de autenticación neumórfica para Inventa.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility Principle (SRP): Orquesta los subcomponentes especializados
 *   (LoginForm, TwoFactorStep, RegisterNotice, AuthOverlay) según el dispositivo y el flujo de sesión.
 * - Open/Closed Principle (OCP): Permite extender nuevos métodos de autenticación sin modificar
 *   el árbol estructural de la tarjeta.
 *
 * Misma estructura y animaciones; estilo de vidrio + paleta activa, como el panel y la landing.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from './LoginForm';
import { TwoFactorStep } from './TwoFactorStep';
import { RegisterNotice } from './RegisterNotice';
import { AuthOverlay } from './AuthOverlay';
import type { LoginResult } from '../types/auth.types';
import { BOTON_SECUNDARIO } from './auth.estilos';

type AuthMode = 'login' | 'registro';

export function AuthCard() {
  const router = useRouter();
  const { paso2FA, usuario } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [rolError, setRolError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(globalThis.location.search);
      if (params.get('error') === 'acceso_denegado_sucursal') {
        setRolError(
          'Acceso restringido: El dashboard actual está reservado exclusivamente para cuentas con rol "admin-sucursal". Inicie sesión con una cuenta de Administrador de Sucursal.'
        );
      }
    }
  }, []);

  const isLogin = mode === 'login';

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'registro' : 'login'));
  };

  const handleAuthSuccess = (resultado?: LoginResult) => {
    // Si la respuesta requiere 2FA, no redirigir todavía (el estado paso2FA mostrará TwoFactorStep)
    if (resultado?.tipo === 'REQUIERE_2FA') {
      return;
    }

    const rol = resultado?.tipo === 'EXITO' ? resultado.data.usuario.rolNombre : usuario?.rolNombre;

    // Redirección inteligente post-login según el rol
    if (rol === 'cajero') {
      router.push('/pos');
    } else if (rol === 'vendedor-b2b') {
      router.push('/vendedor-b2b');
    } else if (rol === 'admin-sucursal') {
      router.push('/admin-sucursal');
    } else if (rol === 'super-admin' || rol === 'superadmin') {
      router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative w-full max-w-[780px] mx-auto px-3 sm:px-4">
      {/* Banner de restricción de rol */}
      {rolError && (
        <div
          role="alert"
          className="mb-4 p-4 rounded-[10px] bg-amber-50 text-amber-800 dark:bg-amber-500/12 dark:text-amber-300 ring-1 ring-inset ring-amber-600/25 font-sans text-[13px] flex items-start gap-3 animate-in fade-in duration-300"
        >
          <span className="text-xl leading-none">⚠️</span>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">
              Restricción de perfil y acceso
            </h4>
            <p className="leading-relaxed text-text-muted">{rolError}</p>
          </div>
          <button type="button"
            onClick={() => setRolError(null)}
            className="text-current hover:text-text transition-colors text-xs font-mono px-1.5 py-0.5 rounded cursor-pointer"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Anunciador aria-live para accesibilidad de lectores de pantalla */}
      <div className="sr-only" aria-live="polite">
        {paso2FA
          ? 'Modo actual: Verificación de segundo factor 2FA'
          : isLogin
          ? 'Modo actual: Iniciar sesión'
          : 'Modo actual: Crear cuenta'}
      </div>

      {/* Tarjeta principal de vidrio */}
      <div className="vidrio relative w-full rounded-2xl overflow-hidden transition-all duration-300">
        {/* Brillos sutiles de fondo (marca + ámbar del logo) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          <div className="absolute -top-24 -left-20 size-72 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-ambar/[0.08] blur-3xl" />
        </div>

        {/* ============================================================== */}
        {/* LAYOUT ESCRITORIO (>= 1024px): Doble Panel + Overlay Deslizante */}
        {/* ============================================================== */}
        <div className="hidden lg:grid grid-cols-2 relative min-h-[500px] z-10">
          {/* Panel Izquierdo: Login o Segundo Factor 2FA */}
          <div
            className={`flex flex-col justify-center px-8 py-7 transition-all duration-600 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
              isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
            }`}
            aria-hidden={!isLogin}
          >
            {paso2FA ? (
              <TwoFactorStep onSuccess={handleAuthSuccess} />
            ) : (
              <LoginForm onSuccess={handleAuthSuccess} />
            )}
          </div>

          {/* Panel Derecho: Información de Registro / Acceso Corporativo */}
          <div
            className={`flex flex-col justify-center px-8 py-7 transition-all duration-600 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
              !isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
            }`}
            aria-hidden={isLogin}
          >
            <RegisterNotice onSwitchToLogin={() => setMode('login')} />
          </div>

          {/* Panel Overlay Deslizante */}
          {!paso2FA && <AuthOverlay isLogin={isLogin} onToggleMode={toggleMode} />}
        </div>

        {/* ============================================================== */}
        {/* LAYOUT MÓVIL (< 1024px): Formulario Centrado con Toggle        */}
        {/* ============================================================== */}
        <div className="block lg:hidden px-5 py-6 relative z-10">
          {paso2FA ? (
            <TwoFactorStep onSuccess={handleAuthSuccess} />
          ) : isLogin ? (
            <div>
              <LoginForm isMobile onSuccess={handleAuthSuccess} />

              {/* Toggle a Solicitar Acceso en Móvil */}
              <div className="mt-5 pt-4 border-t border-border text-center">
                <p className="font-sans text-[13px] text-text-muted mb-2">
                  ¿Necesitas una cuenta institucional?
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className={BOTON_SECUNDARIO}
                >
                  Solicitar acceso
                </button>
              </div>
            </div>
          ) : (
            <div>
              <RegisterNotice isMobile onSwitchToLogin={() => setMode('login')} />

              {/* Switch Móvil a Iniciar Sesión */}
              <div className="mt-5 pt-4 border-t border-border text-center">
                <p className="font-sans text-[13px] text-text-muted mb-2">
                  ¿Ya tienes una cuenta activa en Inventa?
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className={BOTON_SECUNDARIO}
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
