'use client';

/**
 * useEmpresaB2BDetalle.ts — Hook para el detalle integral de una empresa B2B:
 * cupo, rentabilidad comercial, créditos, abonos y avisos de pago.
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { carterasService } from '../api';
import type {
  AvisoPagoCreditoDto,
  AvisarPagoInput,
  EmpresaB2BDetalleDto,
  SolicitarCreditoB2BInput,
  SolicitarCreditoB2BResponseDto,
} from '../types';

export function useEmpresaB2BDetalle(clienteId: string) {
  const [detalle, setDetalle] = useState<EmpresaB2BDetalleDto | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState<boolean>(false);

  const cargar = useCallback(async () => {
    if (!clienteId) return;
    setCargando(true);
    setError(null);
    setSinPermiso(false);
    try {
      const res = await carterasService.obtenerEmpresaDetalle(clienteId);
      setDetalle(res);
    } catch (err) {
      if (err instanceof ApiError && err.isPermisoDenegado()) {
        setSinPermiso(true);
        setError('No cuentas con permisos para consultar el detalle de esta empresa.');
      } else {
        setError(
          err instanceof Error ? err.message : 'No fue posible cargar el detalle de la empresa.',
        );
      }
    } finally {
      setCargando(false);
    }
  }, [clienteId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const avisarPago = useCallback(
    async (creditoId: string, payload: AvisarPagoInput): Promise<AvisoPagoCreditoDto> => {
      const aviso = await carterasService.avisarPago(creditoId, payload);
      await cargar();
      return aviso;
    },
    [cargar],
  );

  const solicitarCredito = useCallback(
    async (payload: SolicitarCreditoB2BInput): Promise<SolicitarCreditoB2BResponseDto> => {
      const res = await carterasService.solicitarCredito(clienteId, payload);
      await cargar();
      return res;
    },
    [clienteId, cargar],
  );

  return {
    detalle,
    cargando,
    error,
    sinPermiso,
    recargar: cargar,
    avisarPago,
    solicitarCredito,
  };
}
