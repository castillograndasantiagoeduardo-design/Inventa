/**
 * /pago/resultado — Resultado del pago.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CuentaShell, ResultadoPagoView } from '@/features/suscripciones';

export const metadata: Metadata = { title: 'Resultado del pago | Inventa' };

export default function Pagina() {
  return (
    <CuentaShell etiqueta="Resultado del pago">
      <Suspense>
        <ResultadoPagoView />
      </Suspense>
    </CuentaShell>
  );
}
