'use client';

/**
 * /admin-sucursal/configuracion — Identidad corporativa de la empresa y seguridad de la cuenta (2FA)
 * para el Administrador de Sucursal.
 */

import React from 'react';
import { PageHeader } from '@/components/panel/PageHeader';
import { MarcaEmpresaCard } from '@/features/marca';
import { ToastProvider } from '@/components/ui/Toast';
import { Activar2FACard } from '@/features/autenticacion/components/cuenta/Activar2FACard';
import { Desactivar2FACard } from '@/features/autenticacion/components/cuenta/Desactivar2FACard';

export default function AdminSucursalConfiguracionPage() {
  return (
    <ToastProvider>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Configuración"
          subtitle="Identidad corporativa de la empresa y seguridad de acceso (2FA)"
        />
        <MarcaEmpresaCard />
        <Activar2FACard />
        <Desactivar2FACard />
      </div>
    </ToastProvider>
  );
}
