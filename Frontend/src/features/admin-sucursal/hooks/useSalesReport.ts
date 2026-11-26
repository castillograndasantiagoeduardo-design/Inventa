'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReporteVentasDto } from '../types/branch-reports.types';
import { branchReportsService } from '../api/branch-reports.service';

interface UseSalesReportOptions {
  desde: string;
  hasta: string;
  sucursalId?: number;
}

export function useSalesReport({ desde, hasta, sucursalId }: UseSalesReportOptions) {
  const [data, setData] = useState<ReporteVentasDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const cargarDatos = useCallback(async () => {
    if (!desde || !hasta) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await branchReportsService.obtenerReporteVentas({
        desde,
        hasta,
        sucursalId,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reporte de ventas');
    } finally {
      setIsLoading(false);
    }
  }, [desde, hasta, sucursalId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const descargarCsv = useCallback(async () => {
    setIsDownloading(true);
    try {
      await branchReportsService.descargarReporteCsv('ventas', {
        desde,
        hasta,
        sucursalId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar CSV de ventas');
    } finally {
      setIsDownloading(false);
    }
  }, [desde, hasta, sucursalId]);

  return {
    data,
    isLoading,
    error,
    reload: cargarDatos,
    isDownloading,
    descargarCsv,
  };
}
