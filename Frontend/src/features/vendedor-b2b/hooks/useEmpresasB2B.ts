'use client';

/**
 * useEmpresasB2B.ts — Hook para consultar el listado de empresas B2B ("Mis empresas"),
 * aplicar filtros, simular cupo y enviar solicitudes de crédito ("Soltar crédito").
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { carterasService } from '../api';
import type {
  EmpresaB2BResumenDto,
  EvaluacionCreditoB2BDto,
  FiltrosEmpresasB2B,
  ResumenCarteraDto,
  SimularCreditoB2BInput,
  SolicitarCreditoB2BInput,
  SolicitarCreditoB2BResponseDto,
} from '../types';

export function useEmpresasB2B(filtrosIniciales?: FiltrosEmpresasB2B) {
  const [empresas, setEmpresas] = useState<EmpresaB2BResumenDto[]>([]);
  const [resumen, setResumen] = useState<ResumenCarteraDto | null>(null);
  const [filtros, setFiltros] = useState<FiltrosEmpresasB2B>({
    buscar: filtrosIniciales?.buscar ?? '',
    estadoCredito: filtrosIniciales?.estadoCredito,
    soloEnMora: filtrosIniciales?.soloEnMora ?? false,
    conCartera: filtrosIniciales?.conCartera ?? false,
  });
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState<boolean>(false);

  const cargar = useCallback(async (filtrosActuales: FiltrosEmpresasB2B) => {
    setCargando(true);
    setError(null);
    setSinPermiso(false);
    try {
      const res = await carterasService.listarEmpresas({
        buscar: filtrosActuales.buscar?.trim() || undefined,
        estadoCredito: filtrosActuales.estadoCredito,
        soloEnMora: filtrosActuales.soloEnMora ? true : undefined,
        conCartera: filtrosActuales.conCartera ? true : undefined,
      });
      setEmpresas(res.empresas);
      setResumen(res.resumen);
    } catch (err) {
      if (err instanceof ApiError && err.isPermisoDenegado()) {
        setSinPermiso(true);
        setError('No cuentas con permisos para consultar el módulo de cartera B2B.');
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'No fue posible cargar tus empresas corporativas B2B.',
        );
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargar(filtros);
    }, 220);
    return () => clearTimeout(timer);
  }, [filtros, cargar]);

  const recargar = useCallback(async () => {
    await cargar(filtros);
  }, [cargar, filtros]);

  const limpiarFiltros = useCallback(() => {
    setFiltros({
      buscar: '',
      estadoCredito: undefined,
      soloEnMora: false,
      conCartera: false,
    });
  }, []);

  const simularCredito = useCallback(
    async (payload: SimularCreditoB2BInput): Promise<EvaluacionCreditoB2BDto> => {
      return await carterasService.simularCredito(payload);
    },
    [],
  );

  const solicitarCredito = useCallback(
    async (
      clienteId: string,
      payload: SolicitarCreditoB2BInput,
    ): Promise<SolicitarCreditoB2BResponseDto> => {
      const res = await carterasService.solicitarCredito(clienteId, payload);
      await cargar(filtros);
      return res;
    },
    [cargar, filtros],
  );

  return {
    empresas,
    resumen,
    filtros,
    setFiltros,
    limpiarFiltros,
    cargando,
    error,
    sinPermiso,
    recargar,
    simularCredito,
    solicitarCredito,
  };
}
