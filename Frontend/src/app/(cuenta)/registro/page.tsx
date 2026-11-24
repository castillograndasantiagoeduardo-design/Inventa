/**
 * /registro — Crear una cuenta gratuita.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CuentaShell, RegistroCuentaForm } from '@/features/suscripciones';

export const metadata: Metadata = { title: 'Crear cuenta | Inventa' };

export default function Pagina() {
  return (
    <CuentaShell etiqueta="Crear una cuenta gratuita" accion="ninguna">
      <Suspense>
        <RegistroCuentaForm />
      </Suspense>
    </CuentaShell>
  );
}
