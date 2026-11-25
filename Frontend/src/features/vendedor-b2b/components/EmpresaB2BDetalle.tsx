'use client';

/**
 * EmpresaB2BDetalle.tsx — Vista de detalle financiero, crédito, rentabilidad y cartera
 * para una empresa B2B específica.
 */

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Tarjeta } from '@/components/Tarjeta';

export interface EmpresaB2BDetalleProps {
  clienteId: string;
}

export function EmpresaB2BDetalle({ clienteId }: EmpresaB2BDetalleProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/vendedor-b2b/empresas"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl superficie-control text-xs font-medium text-text hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Mis empresas</span>
        </Link>
      </div>

      <Tarjeta titulo="Detalle de empresa B2B">
        <p className="text-xs font-mono text-text-muted">ID: {clienteId}</p>
      </Tarjeta>
    </div>
  );
}
