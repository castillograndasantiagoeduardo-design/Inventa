/**
 * /cuenta — Mi cuenta y planes.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CuentaShell, MiCuentaView } from '@/features/suscripciones';

export const metadata: Metadata = { title: 'Mi cuenta | Inventa' };

export default function Pagina() {
  return (
    <CuentaShell etiqueta="Mi cuenta y planes">
      <Suspense>
        <MiCuentaView />
      </Suspense>
    </CuentaShell>
  );
}
