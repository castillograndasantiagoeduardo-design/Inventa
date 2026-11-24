/**
 * /pago/simulado — Pasarela de pagos simulada.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CuentaShell, PasarelaSimuladaView } from '@/features/suscripciones';

export const metadata: Metadata = { title: 'Pasarela de pagos | Inventa' };

export default function Pagina() {
  return (
    <CuentaShell etiqueta="Pasarela de pagos simulada">
      <Suspense>
        <PasarelaSimuladaView />
      </Suspense>
    </CuentaShell>
  );
}
