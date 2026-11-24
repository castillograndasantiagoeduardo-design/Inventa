'use client';

/**
 * RegisterNotice.tsx — Panel "Crear cuenta" de la tarjeta de acceso.
 *
 * Dos caminos reales:
 * - Dueños de negocio: crean una cuenta gratuita en /registro, ven los planes y compran.
 * - Empleados: su usuario lo crea el administrador de su empresa (no hay autorregistro).
 */

import React from 'react';
import Link from 'next/link';
import { Building2, Users } from 'lucide-react';
import { BOTON_PRIMARIO, CAJA_INFO, ENLACE, TITULO, TITULO_ACENTO } from './auth.estilos';

interface RegisterNoticeProps {
  isMobile?: boolean;
  onSwitchToLogin?: () => void;
}

export function RegisterNotice({ isMobile = false, onSwitchToLogin }: RegisterNoticeProps) {
  return (
    <div className={`w-full ${isMobile ? 'max-w-[340px]' : 'max-w-[300px]'} mx-auto`}>
      <h2 className={`${TITULO} mb-4`}>
        Crear <span className={TITULO_ACENTO}>cuenta</span>
      </h2>

      <div className="space-y-3.5">
        <div className={CAJA_INFO}>
          <p className="mb-1 flex items-center gap-1.5 font-medium text-text">
            <Building2 className="size-4 text-brand-500" aria-hidden="true" />
            ¿Tienes un negocio?
          </p>
          <p>Crea una cuenta gratuita, conoce los planes y activa el tuyo cuando quieras.</p>
        </div>

        <Link href="/registro" className={BOTON_PRIMARIO}>
          Crear cuenta gratis
        </Link>

        <div className={CAJA_INFO}>
          <p className="mb-1 flex items-center gap-1.5 font-medium text-text">
            <Users className="size-4 text-brand-500" aria-hidden="true" />
            ¿Trabajas en una empresa que ya usa Inventa?
          </p>
          <p>Tu usuario lo crea el administrador de tu empresa. Pídele tus datos de acceso.</p>
        </div>

        {onSwitchToLogin && (
          <p className="text-center">
            <button type="button" onClick={onSwitchToLogin} className={`${ENLACE} cursor-pointer`}>
              Ya tengo cuenta: iniciar sesión
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
