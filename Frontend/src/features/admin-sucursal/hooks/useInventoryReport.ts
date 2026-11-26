'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReporteInventarioDto } from '../types/branch-reports.types';
import { branchReportsService } from '../api/branch-reports.service';

interface UseInventoryReportOptions {
  sucursalId?: number;
  initialLimit?: number;
}

export function useInventoryReport({
  sucursalId,
  initialLimit = 10,
}: UseInventoryReportOptions = {}) {
  const [data, setData] = useState<ReporteInventarioDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [soloBajoMinimo, setSoloBajoMinimo] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await branchReportsService.obtenerReporteInventario({
        sucursalId,
        soloBajoMinimo,
        page,
        limit,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reporte de inventario');
    } finally {
      setIsLoading(false);
    }
  }, [sucursalId, soloBajoMinimo, page, limit]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const descargarCsv = useCallback(async () => {
    setIsDownloading(true);
    try {
      await branchReportsService.descargarReporteCsv('inventario', {
        sucursalId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar CSV de inventario');
    } finally {
      setIsDownloading(false);
    }
  }, [sucursalId]);

  return {
    data,
    isLoading,
    error,
    page,
    setPage,
    limit,
    setLimit,
    soloBajoMinimo,
    setSoloBajoMinimo,
    reload: cargarDatos,
    isDownloading,
    descargarCsv,
  };
}
