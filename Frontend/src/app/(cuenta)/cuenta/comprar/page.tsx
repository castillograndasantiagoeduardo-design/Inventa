/**
 * /cuenta/comprar — Resumen de compra del plan.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CuentaShell, CheckoutView } from '@/features/suscripciones';

export const metadata: Metadata = { title: 'Comprar plan | Inventa' };

export default function Pagina() {
  return (
    <CuentaShell etiqueta="Resumen de compra del plan">
      <Suspense>
        <CheckoutView />
      </Suspense>
    </CuentaShell>
  );
}
