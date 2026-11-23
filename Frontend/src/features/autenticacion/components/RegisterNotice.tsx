'use client';

/**
 * RegisterNotice.tsx — Vista informativa para 'Crear Cuenta' en Inventa ERP.
 *
 * Principio SOLID:
 * - Single Responsibility: Explica amigablemente la política corporativa de cuentas
 *   privadas sin inventar llamadas inexistentes al backend.
 */

import React, { useState } from 'react';
import { Building2, Check } from 'lucide-react';
import { SocialAuthButtons } from './SocialAuthButtons';
import { BOTON_PRIMARIO, CAJA_INFO, CAMPO, ETIQUETA, INPUT, SEPARADOR, TITULO, TITULO_ACENTO } from './auth.estilos';

interface RegisterNoticeProps {
  isMobile?: boolean;
  onSwitchToLogin?: () => void;
}

export function RegisterNotice({
  isMobile = false,
  onSwitchToLogin,
}: RegisterNoticeProps) {
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [email, setEmail] = useState('');

  const handleSolicitar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSolicitudEnviada(true);
  };

  return (
    <div className={`w-full ${isMobile ? 'max-w-[340px]' : 'max-w-[300px]'} mx-auto`}>
      <h2 className={`${TITULO} mb-4`}>
        Crear <span className={TITULO_ACENTO}>cuenta</span>
      </h2>

      <SocialAuthButtons />

      <p className={SEPARADOR}>acceso corporativo y sucursales</p>

      {solicitudEnviada ? (
        <div role="status" className={`${CAJA_INFO} text-center animate-in fade-in zoom-in-95 duration-200`}>
          <div className="size-10 mx-auto mb-2 rounded-full bg-green-500/15 text-green-600 dark:text-green-300 grid place-items-center">
            <Check className="size-5" aria-hidden="true" />
          </div>
          <h3 className="font-titulos text-base font-semibold text-text mb-1">Solicitud registrada</h3>
          <p className="text-[13px] leading-relaxed mb-3">
            Se ha notificado al Administrador de TI para tu correo{' '}
            <span className="font-mono text-brand-600 dark:text-brand-300">{email}</span>. Recibirás tu credencial temporal
            una vez aprobado tu rol.
          </p>
          <button type="button" onClick={onSwitchToLogin} className={BOTON_PRIMARIO}>
            Ir a iniciar sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSolicitar} className="space-y-3.5">
          <div className={CAJA_INFO}>
            <p className="mb-1 flex items-center gap-1.5 font-medium text-text">
              <Building2 className="size-4 text-brand-500" aria-hidden="true" />
              Sistema ERP multi-sucursal privado
            </p>
            <p>
              En Inventa, los perfiles de operadores, cajeros y supervisores son gestionados por el Administrador de cada Sucursal.
            </p>
          </div>

          <div>
            <label htmlFor="reg-corp-email" className={`${ETIQUETA} mb-1.5`}>
              Tu correo institucional
            </label>
            <div className={CAMPO}>
              <input
                id="reg-corp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@empresa.com"
                className={INPUT}
              />
            </div>
          </div>

          <div className="pt-1.5">
            <button type="submit" className={BOTON_PRIMARIO}>
              Solicitar alta de usuario
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
