'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CriterioOrdenProductos, ReporteProductosDto } from '../types/branch-reports.types';
import { branchReportsService } from '../api/branch-reports.service';

interface UseProductsReportOptions {
  desde: string;
  hasta: string;
  sucursalId?: number;
  ordenInicial?: CriterioOrdenProductos;
  limiteInicial?: number;
}

export function useProductsReport({
  desde,
  hasta,
  sucursalId,
  ordenInicial = 'ingresos',
  limiteInicial = 10,
}: UseProductsReportOptions) {
  const [data, setData] = useState<ReporteProductosDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orden, setOrden] = useState<CriterioOrdenProductos>(ordenInicial);
  const [limite, setLimite] = useState<number>(limiteInicial);
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const cargarDatos = useCallback(async () => {
    if (!desde || !hasta) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await branchReportsService.obtenerReporteProductos({
        desde,
        hasta,
        sucursalId,
        orden,
        limite,
        categoriaId,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reporte de productos');
    } finally {
      setIsLoading(false);
    }
  }, [desde, hasta, sucursalId, orden, limite, categoriaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const descargarCsv = useCallback(async () => {
    setIsDownloading(true);
    try {
      await branchReportsService.descargarReporteCsv('productos', {
        desde,
        hasta,
        sucursalId,
        orden,
        categoriaId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar CSV de productos');
    } finally {
      setIsDownloading(false);
    }
  }, [desde, hasta, sucursalId, orden, categoriaId]);

  return {
    data,
    isLoading,
    error,
    orden,
    setOrden,
    limite,
    setLimite,
    categoriaId,
    setCategoriaId,
    reload: cargarDatos,
    isDownloading,
    descargarCsv,
  };
}
