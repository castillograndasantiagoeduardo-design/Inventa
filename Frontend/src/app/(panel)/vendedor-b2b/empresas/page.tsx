'use client';

/**
 * /vendedor-b2b/empresas — Sección "Mis empresas" del panel del Vendedor B2B.
 */

import React from 'react';
import { PERMISSIONS } from '@inventa/contracts';
import { RequierePermiso } from '@/components/panel/RequierePermiso';
import { VendedorB2BLayout, MisEmpresasView } from '@/features/vendedor-b2b';

export default function MisEmpresasPage() {
  return (
    <RequierePermiso permiso={PERMISSIONS.FACTURACION_CONSULTAR}>
      <VendedorB2BLayout>
        <MisEmpresasView />
      </VendedorB2BLayout>
    </RequierePermiso>
  );
}
