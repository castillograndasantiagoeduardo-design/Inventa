'use client';

/**
 * PanelShell.tsx — Marco del panel del Super Admin con el estilo de /admin-sucursal
 * (Glassmorphism Ejecutivo): fondo ambiental, logo de la empresa de fondo, sidebar
 * flotante y header de vidrio.
 *
 * - Espera la rehidratación de la sesión (GET /auth/verificar) antes de pintar.
 * - Si la sesión no es válida redirige a /acceso (el middleware ya cubre la mayoría
 *   de casos; esto atrapa cookies vencidas que no pudieron renovarse).
 * - Monta el ToastProvider para todas las vistas del panel.
 */

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/autenticacion';
import { ToastProvider } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { FondoAmbiental } from '@/components/FondoAmbiental';
import { MarcaDeAgua } from '@/features/marca';
import { Sidebar } from './Sidebar';
import { PanelHeader } from './PanelHeader';

export function PanelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/acceso?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-bg text-text-muted font-sans relative isolate">
        <FondoAmbiental />
        <Spinner size={36} label="Cargando sesión" />
        <span className="text-sm">{isLoading ? 'Verificando sesión…' : 'Redirigiendo al acceso…'}</span>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg text-text font-sans relative isolate overflow-x-clip transition-colors duration-300">
        <FondoAmbiental />
        <MarcaDeAgua />
        <div className="flex items-start p-4 sm:p-5 lg:p-6 gap-6 max-w-[1680px] mx-auto min-h-screen">
          <div className="md:sticky md:top-4 md:self-start z-30 shrink-0">
            <Sidebar open={menuAbierto} onClose={() => setMenuAbierto(false)} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <PanelHeader onMenuClick={() => setMenuAbierto(true)} />
            <main className="flex-1 w-full pb-[env(safe-area-inset-bottom)]">{children}</main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
