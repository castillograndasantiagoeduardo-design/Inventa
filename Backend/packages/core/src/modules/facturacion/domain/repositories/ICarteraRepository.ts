import type {
  AbonoCreditoDto,
  AvisoPagoCreditoDto,
  FiltrosAvisosPago,
  FiltrosCarteraB2B,
} from '@inventa/contracts';
import type { CreditoB2B } from '../entities/CreditoB2B.ts';

/**
 * Datos crudos de ventas y devoluciones por cliente para calcular ganancia y rentabilidad.
 */
export interface RentabilidadClienteRaw {
  clienteId: string;
  totalFacturado: number;
  totalDevoluciones: number;
  gananciaBrutaFacturas: number;
  gananciaRevertidaDevoluciones: number;
}

export interface RegistrarAbonoAtomicoParams {
  creditoId: string;
  clienteId: string;
  monto: number;
  registradoPor: string;
  avisoId?: string | null;
}

export interface RegistrarAbonoAtomicoResult {
  abono: AbonoCreditoDto;
  creditoActualizado: CreditoB2B;
  saldoClienteAntes: number;
  saldoClienteDespues: number;
  cupoUtilizadoAntes: number;
  cupoUtilizadoDespues: number;
}

/**
 * Puerto de persistencia para la cartera corporativa B2B, abonos y avisos de pago.
 * La implementación en `packages/database` garantiza atomicidad mediante Unit of Work.
 */
export interface ICarteraRepository {
  registrarCreditoFactura(params: {
    facturaId: string;
    clienteId: string;
    sucursalId: number;
    monto: number;
    fechaEmision: Date;
    plazoDias: number;
  }): Promise<CreditoB2B>;

  obtenerCreditoPorId(creditoId: string): Promise<CreditoB2B | null>;

  listarCreditos(
    filtros: FiltrosCarteraB2B & { sucursalId?: number },
  ): Promise<{ items: CreditoB2B[]; total: number }>;

  listarCreditosPorCliente(clienteId: string, sucursalId?: number): Promise<CreditoB2B[]>;

  listarAbonosPorCliente(clienteId: string, limite?: number): Promise<AbonoCreditoDto[]>;

  obtenerRentabilidadPorClientes(
    clienteIds: string[],
    sucursalId?: number,
  ): Promise<Record<string, RentabilidadClienteRaw>>;

  crearAvisoPago(params: {
    creditoId: string;
    monto: number;
    referencia: string;
    nota: string | null;
    avisadoPor: string;
  }): Promise<AvisoPagoCreditoDto>;

  existeAvisoPendienteConReferencia(creditoId: string, referencia: string): Promise<boolean>;

  obtenerAvisoPorId(avisoId: string): Promise<AvisoPagoCreditoDto | null>;

  listarAvisosPago(
    filtros: FiltrosAvisosPago & { sucursalId?: number },
  ): Promise<{ items: AvisoPagoCreditoDto[]; total: number }>;

  contarAvisosPendientesPorClientes(
    clienteIds: string[],
    sucursalId?: number,
  ): Promise<Record<string, number>>;

  registrarAbonoAtomico(params: RegistrarAbonoAtomicoParams): Promise<RegistrarAbonoAtomicoResult>;

  rechazarAvisoPago(params: {
    avisoId: string;
    revisadoPor: string;
    motivoRechazo: string;
  }): Promise<AvisoPagoCreditoDto>;
}
