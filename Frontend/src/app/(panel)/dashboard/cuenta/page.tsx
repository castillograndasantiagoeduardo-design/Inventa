'use client';

/**
 * /dashboard/cuenta — Seguridad de la cuenta autenticada (2FA). No requiere permisos:
 * las rutas /auth/2fa/* solo exigen sesión válida.
 */

import { PageHeader } from '@/components/panel/PageHeader';
import { MarcaEmpresaCard } from '@/features/marca';
import { Activar2FACard } from '@/features/autenticacion/components/cuenta/Activar2FACard';
import { Desactivar2FACard } from '@/features/autenticacion/components/cuenta/Desactivar2FACard';

export default function CuentaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mi cuenta" subtitle="Identidad corporativa y seguridad del acceso" />
      <MarcaEmpresaCard />
      <Activar2FACard />
      <Desactivar2FACard />
    </div>
  );
}
