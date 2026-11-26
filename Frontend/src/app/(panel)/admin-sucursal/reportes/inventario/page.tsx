'use client';

import React, { Suspense } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import {
  useInventoryReport,
  StockHealthSegmentedBar,
  LowStockReportTable,
  ErrorState,
} from '@/features/admin-sucursal';

function InventarioReportView() {
  const {
    data,
    isLoading,
    error,
    page,
    setPage,
    reload,
    isDownloading,
    descargarCsv,
  } = useInventoryReport();

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-2xl bg-white/[0.03] animate-pulse" />
        <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorState
        title="Error al cargar el reporte de inventario"
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
          Estado actual del stock de la sede en tiempo real
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

      {/* 1. Barra segmentada de salud de stock y valoración */}
      <StockHealthSegmentedBar
        saludStock={data.saludStock}
        valorTotalInventario={data.valorTotalInventario}
      />

      {/* 2. Tabla paginada de artículos con reposición requerida */}
      <LowStockReportTable
        items={data.productosBajoMinimo.items}
        total={data.productosBajoMinimo.total}
        page={page}
        totalPaginas={data.productosBajoMinimo.totalPaginas}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function AdminSucursalReportesInventarioPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-44 rounded-2xl bg-white/[0.03] animate-pulse" />
          <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
        </div>
      }
    >
      <InventarioReportView />
    </Suspense>
  );
}
