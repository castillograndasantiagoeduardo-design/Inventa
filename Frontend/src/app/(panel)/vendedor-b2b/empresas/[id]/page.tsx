'use client';

/**
 * /vendedor-b2b/empresas/[id] — Detalle financiero, crédito y cartera de una empresa B2B.
 */

import React from 'react';
import { useParams } from 'next/navigation';
import { PERMISSIONS } from '@inventa/contracts';
import { RequierePermiso } from '@/components/panel/RequierePermiso';
import { VendedorB2BLayout, EmpresaB2BDetalle } from '@/features/vendedor-b2b';

export default function EmpresaB2BDetallePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <RequierePermiso permiso={PERMISSIONS.FACTURACION_CONSULTAR}>
      <VendedorB2BLayout>
        <EmpresaB2BDetalle clienteId={id} />
      </VendedorB2BLayout>
    </RequierePermiso>
  );
}
