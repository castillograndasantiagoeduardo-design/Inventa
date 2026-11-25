'use client';

/**
 * useCarteraB2B.ts — Hook para consultar la cartera activa (créditos vigentes, pagados
 * y en mora), el ranking de empresas en mora y reportar avisos de pago (vendedor B2B).
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { carterasService } from '../api';
import type {
  AvisoPagoCreditoDto,
  AvisarPagoInput,
  CreditoB2BDto,
  EmpresaEnMoraDto,
  EstadoCarteraB2B,
} from '../types';

export function useCarteraB2B() {
  const [creditos, setCreditos] = useState<CreditoB2BDto[]>([]);
  const [totalCreditos, setTotalCreditos] = useState<number>(0);
  const [pagina, setPagina] = useState<number>(1);
  const [limite] = useState<number>(20);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoCarteraB2B | undefined>(undefined);
  const [resumenCartera, setResumenCartera] = useState<{
    vigentes: number;
    pagados: number;
    enMora: number;
    saldoTotal: number;
  } | null>(null);

  const [mora, setMora] = useState<EmpresaEnMoraDto[]>([]);
  const [cargandoCartera, setCargandoCartera] = useState<boolean>(true);
  const [cargandoMora, setCargandoMora] = useState<boolean>(true);
  const [errorCartera, setErrorCartera] = useState<string | null>(null);
  const [errorMora, setErrorMora] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState<boolean>(false);

  const cargarCartera = useCallback(async () => {
    setCargandoCartera(true);
    setErrorCartera(null);
    setSinPermiso(false);
    try {
      const res = await carterasService.listarCartera({
        estado: estadoFiltro,
        pagina,
        limite,
      });
      setCreditos(res.items);
      setTotalCreditos(res.total);
      setResumenCartera(res.resumen);
    } catch (err) {
      if (err instanceof ApiError && err.isPermisoDenegado()) {
        setSinPermiso(true);
        setErrorCartera('No cuentas con permiso para consultar la cartera B2B.');
      } else {
        setErrorCartera(
          err instanceof Error ? err.message : 'No fue posible consultar la cartera B2B.',
        );
      }
    } finally {
      setCargandoCartera(false);
    }
  }, [estadoFiltro, pagina, limite]);

  const cargarMora = useCallback(async () => {
    setCargandoMora(true);
    setErrorMora(null);
    try {
      const res = await carterasService.listarMora();
      setMora(res);
    } catch (err) {
      if (err instanceof ApiError && err.isPermisoDenegado()) {
        setSinPermiso(true);
        setErrorMora('No cuentas con permiso para consultar empresas en mora.');
      } else {
        setErrorMora(
          err instanceof Error ? err.message : 'No fue posible consultar las empresas en mora.',
        );
      }
    } finally {
      setCargandoMora(false);
    }
  }, []);

  useEffect(() => {
    void cargarCartera();
  }, [cargarCartera]);

  useEffect(() => {
    void cargarMora();
  }, [cargarMora]);

  const cambiarEstadoFiltro = useCallback((nuevoEstado?: EstadoCarteraB2B) => {
    setEstadoFiltro(nuevoEstado);
    setPagina(1);
  }, []);

  const avisarPago = useCallback(
    async (creditoId: string, payload: AvisarPagoInput): Promise<AvisoPagoCreditoDto> => {
      const aviso = await carterasService.avisarPago(creditoId, payload);
      await Promise.all([cargarCartera(), cargarMora()]);
      return aviso;
    },
    [cargarCartera, cargarMora],
  );

  return {
    creditos,
    totalCreditos,
    pagina,
    setPagina,
    limite,
    estadoFiltro,
    cambiarEstadoFiltro,
    resumenCartera,
    mora,
    cargandoCartera,
    cargandoMora,
    errorCartera,
    errorMora,
    sinPermiso,
    cargarCartera,
    cargarMora,
    avisarPago,
  };
}
