'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, RefreshCw } from 'lucide-react';
import {
  useProductsReport,
  ProductsRankingTable,
  ErrorState,
  obtenerRangoPreset,
} from '@/features/admin-sucursal';

function ProductosReportView() {
  const searchParams = useSearchParams();
  const defaultRange = obtenerRangoPreset('7d');
  const desde = searchParams.get('desde') || defaultRange.desde;
  const hasta = searchParams.get('hasta') || defaultRange.hasta;

  const {
    data,
    isLoading,
    error,
    orden,
    setOrden,
    limite,
    setLimite,
    reload,
    isDownloading,
    descargarCsv,
  } = useProductsReport({ desde, hasta });

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-72 rounded-2xl bg-white/[0.03] animate-pulse" />
        <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorState
        title="Error al cargar el reporte de productos"
        message={error}
        onRetry={reload}
      />
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Botón de acción: Exportar CSV */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-text-muted font-sans">
          Mostrando rotación y ranking del <span className="font-semibold text-text">{data.rango.desde}</span> al{' '}
          <span className="font-semibold text-text">{data.rango.hasta}</span>
        </div>

        <button
          type="button"
          onClick={descargarCsv}
          disabled={isDownloading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-btn-primario-texto text-xs font-sans font-medium transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isDownloading ? 'Generando CSV...' : 'Exportar CSV'}</span>
        </button>
      </div>

      {/* Tabla de Ranking y Sin Ventas */}
      <ProductsRankingTable
        ranking={data.ranking}
        sinVentas={data.sinVentas}
        orden={orden}
        onCambiarOrden={setOrden}
        limite={limite}
        onCambiarLimite={setLimite}
      />
    </div>
  );
}

export default function AdminSucursalReportesProductosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-72 rounded-2xl bg-white/[0.03] animate-pulse" />
        </div>
      }
    >
      <ProductosReportView />
    </Suspense>
  );
}
