'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DollarSign,
  Receipt,
  Download,
  AlertOctagon,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  useSalesReport,
  KpiReportCard,
  SalesTrendChart,
  PaymentMethodsBar,
  ErrorState,
  obtenerRangoPreset,
} from '@/features/admin-sucursal';
import { formatCOP } from '@/lib/format/moneda';

function VentasReportView() {
  const searchParams = useSearchParams();
  const defaultRange = obtenerRangoPreset('7d');
  const desde = searchParams.get('desde') || defaultRange.desde;
  const hasta = searchParams.get('hasta') || defaultRange.hasta;

  const {
    data,
    isLoading,
    error,
    reload,
    isDownloading,
    descargarCsv,
  } = useSalesReport({ desde, hasta });

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
        <div className="h-44 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorState
        title="Error al cargar el reporte de ventas"
        message={error}
        onRetry={reload}
      />
    );
  }

  if (!data) return null;

  const { resumen, comparativaPeriodoAnterior, serieTemporal, desgloseMetodosPago, granularidad } = data;

  return (
    <div className="space-y-6">
      {/* Botón de acción: Exportar CSV */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-text-muted font-sans">
          Mostrando datos del <span className="font-semibold text-text">{data.rango.desde}</span> al{' '}
          <span className="font-semibold text-text">{data.rango.hasta}</span> ({data.rango.dias} días)
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

      {/* Fila 1: KPIs con variaciones del período anterior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Vendido */}
        <KpiReportCard
          title="Total vendido"
          value={formatCOP(resumen.totalVendido)}
          icon={<DollarSign className="w-4 h-4" />}
          variacionAbsoluta={comparativaPeriodoAnterior.variacionTotalVendido}
          variacionPorcentual={comparativaPeriodoAnterior.variacionPorcentualTotalVendido}
          explicacionContexto="Facturas emitidas"
        />

        {/* Facturas Emitidas */}
        <KpiReportCard
          title="Facturas emitidas"
          value={resumen.totalFacturas.toLocaleString('es-CO')}
          icon={<Receipt className="w-4 h-4" />}
          variacionAbsoluta={comparativaPeriodoAnterior.variacionFacturas}
          variacionPorcentual={comparativaPeriodoAnterior.variacionPorcentualFacturas}
          explicacionContexto="Transacciones válidas"
        />

        {/* Ticket Promedio */}
        <KpiReportCard
          title="Ticket promedio"
          value={formatCOP(resumen.ticketPromedio)}
          icon={<DollarSign className="w-4 h-4" />}
          explicacionContexto="Ventas / Facturas"
        />

        {/* Anuladas (inverso: un aumento es negativo) */}
        <KpiReportCard
          title="Facturas anuladas"
          value={formatCOP(resumen.montoAnuladas)}
          icon={<AlertOctagon className="w-4 h-4" />}
          explicacionContexto={`${resumen.totalAnuladas} anulada(s)`}
          inverso={true}
        />

        {/* Devoluciones (inverso) */}
        <KpiReportCard
          title="Devoluciones"
          value={formatCOP(resumen.montoDevoluciones)}
          icon={<RotateCcw className="w-4 h-4" />}
          explicacionContexto={`${resumen.totalDevoluciones} reembolso(s)`}
          inverso={true}
        />
      </div>

      {/* Fila 2: Gráfica temporal con curvas Bezier y tabla accesible */}
      <SalesTrendChart serie={serieTemporal} granularidad={granularidad} />

      {/* Fila 3: Desglose por método de pago */}
      <PaymentMethodsBar desglose={desgloseMetodosPago} />
    </div>
  );
}

export default function AdminSucursalReportesVentasPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-36 rounded-2xl bg-white/[0.03] animate-pulse" />
          <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
        </div>
      }
    >
      <VentasReportView />
    </Suspense>
  );
}
