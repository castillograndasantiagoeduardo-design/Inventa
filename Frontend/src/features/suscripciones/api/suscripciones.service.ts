/**
 * suscripciones.service.ts — Cuentas de la web, planes y pagos (API de la base central).
 *
 * Usa la sesión de cuenta (cookie HttpOnly cuenta_token), independiente de la del panel:
 * por eso todas las llamadas van con skipAuthRefresh.
 */

import type { IniciarPagoInput, PagoSimuladoInput, PlanDto, RegistroCuentaInput } from '@inventa/contracts';
import { ApiError, apiClient } from '@/lib/api';
import type { CuentaWeb } from '@/features/autenticacion';

const SIN_REFRESH = { skipAuthRefresh: true } as const;

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'expirado';

export interface MiCuenta {
  cuenta: CuentaWeb;
  suscripcion: { planId: string; planNombre: string; venceEn: string; vigente: boolean } | null;
}

export interface CheckoutIniciado {
  referencia: string;
  urlPago: string;
  montoCentavos: number;
  plan: { id: string; nombre: string; diasVigencia: number };
}

export interface PagoConsultado {
  referencia: string;
  estado: EstadoPago;
  montoCentavos: number;
  plan: { id: string; nombre: string; diasVigencia: number };
  nombreEmpresa: string | null;
  motivoRechazo: string | null;
}

export interface ResultadoPago {
  referencia: string;
  estado: EstadoPago;
  empresaId: number | null;
  venceEn: string | null;
  motivo?: string | null;
}

export const suscripcionesService = {
  obtenerPlanes: () => apiClient.get<PlanDto[]>('/planes', SIN_REFRESH),

  registrar: (datos: RegistroCuentaInput) =>
    apiClient.post<{ cuenta: CuentaWeb }>('/cuentas/registro', datos, SIN_REFRESH),

  /** null si no hay sesión de cuenta. */
  async miCuenta(): Promise<MiCuenta | null> {
    try {
      return await apiClient.get<MiCuenta>('/cuentas/yo', SIN_REFRESH);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },

  cerrarSesion: () => apiClient.post<{ ok: boolean }>('/cuentas/logout', undefined, SIN_REFRESH),

  iniciarCheckout: (datos: IniciarPagoInput) => apiClient.post<CheckoutIniciado>('/pagos/checkout', datos, SIN_REFRESH),

  consultarPago: (referencia: string) =>
    apiClient.get<PagoConsultado>(`/pagos/${encodeURIComponent(referencia)}`, SIN_REFRESH),

  pagarSimulado: (referencia: string, tarjeta: PagoSimuladoInput) =>
    apiClient.post<ResultadoPago>(`/pagos/simulado/${encodeURIComponent(referencia)}/pagar`, tarjeta, SIN_REFRESH),

  confirmarPago: (referencia: string) =>
    apiClient.post<ResultadoPago>(`/pagos/${encodeURIComponent(referencia)}/confirmar`, undefined, SIN_REFRESH),
};

/** Ruta interna (pathname + query) a partir de la URL de pago que devuelve la API. */
export function rutaInterna(url: string): string {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}`;
  } catch {
    return url.startsWith('/') ? url : '/';
  }
}

/** Ruta de inicio de sesión que vuelve a `destino` después de entrar. */
export function rutaLogin(destino: string): string {
  return `/acceso?redirect=${encodeURIComponent(destino)}`;
}
