/**
 * vendedorB2b.types.ts — Definiciones de tipos para el módulo de Vendedor B2B.
 *
 * Utiliza los contratos base de @inventa/contracts para garantizar
 * coherencia con el backend.
 */

import type {
  AbonoCreditoDto,
  AvisoPagoCreditoDto,
  AvisarPagoInput,
  ClienteDto,
  CotizacionB2BDto,
  CrearClienteInput,
  CrearCotizacionB2BInput,
  CreditoB2BDto,
  EmpresaB2BDetalleDto,
  EmpresaB2BResumenDto,
  EmpresaEnMoraDto,
  EstadoAvisoPago,
  EstadoCarteraB2B,
  EvaluacionCreditoB2BDto,
  FacturaDto,
  FiltrosAvisosPago,
  FiltrosCarteraB2B,
  FiltrosEmpresasB2B,
  MedioPago,
  PlazoCreditoDias,
  ProductoResponse,
  RegistrarAbonoCreditoInput,
  ResolverAvisoInput,
  ResumenCarteraDto,
  SimularCreditoB2BInput,
  SolicitarCreditoB2BInput,
} from '@inventa/contracts';

export type {
  AbonoCreditoDto,
  AvisoPagoCreditoDto,
  AvisarPagoInput,
  ClienteDto,
  CotizacionB2BDto,
  CrearClienteInput,
  CrearCotizacionB2BInput,
  CreditoB2BDto,
  EmpresaB2BDetalleDto,
  EmpresaB2BResumenDto,
  EmpresaEnMoraDto,
  EstadoAvisoPago,
  EstadoCarteraB2B,
  EvaluacionCreditoB2BDto,
  FacturaDto,
  FiltrosAvisosPago,
  FiltrosCarteraB2B,
  FiltrosEmpresasB2B,
  MedioPago,
  PlazoCreditoDias,
  ProductoResponse,
  RegistrarAbonoCreditoInput,
  ResolverAvisoInput,
  ResumenCarteraDto,
  SimularCreditoB2BInput,
  SolicitarCreditoB2BInput,
};

export interface ListarEmpresasB2BResponseDto {
  empresas: EmpresaB2BResumenDto[];
  resumen: ResumenCarteraDto;
}

export interface ListarCarteraResponseDto {
  items: CreditoB2BDto[];
  total: number;
  pagina: number;
  limite: number;
  resumen: {
    vigentes: number;
    pagados: number;
    enMora: number;
    saldoTotal: number;
  };
}

export interface ListarAvisosPagoResponseDto {
  items: AvisoPagoCreditoDto[];
  total: number;
  pagina: number;
  limite: number;
}

export interface SolicitarCreditoB2BResponseDto {
  cliente: ClienteDto;
  evaluacionCredito: EvaluacionCreditoB2BDto;
  alertaSuperAdminEnviada: boolean;
}

export interface RegistrarAbonoCreditoResponseDto {
  abono: AbonoCreditoDto;
  credito: CreditoB2BDto;
}

export interface ResolverAvisoPagoResponseDto {
  decision: 'confirmar' | 'rechazar';
  aviso: AvisoPagoCreditoDto;
  abono?: AbonoCreditoDto;
  credito?: CreditoB2BDto;
}

export interface CrearClienteResultadoDto {
  cliente: ClienteDto;
  yaExistia: boolean;
  evaluacionCredito?: EvaluacionCreditoB2BDto | null;
  alertaSuperAdminEnviada?: boolean;
}

export interface FacturarCotizacionResultadoDto {
  cotizacion: CotizacionB2BDto;
  factura: FacturaDto;
}

export interface ItemCotizacionB2B {
  productoId: string;
  sku: string;
  nombre: string;
  precioUnitario: number;
  precioVentaOriginal: number;
  esPrecioCorporativo: boolean;
  cantidad: number;
  descuento: number;
  subtotal: number;
  stockDisponible?: number;
}

export interface FiltrosCatalogoB2B {
  texto: string;
  categoriaId: number | null;
  disponibilidad: 'todos' | 'con_stock' | 'stock_bajo';
}

export interface CrearOrdenB2BPayload {
  clienteId: string;
  items: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
  }>;
  pagos: Array<{
    medioPago: MedioPago;
    monto: number;
    referenciaTransaccion?: string | null;
  }>;
  esB2B: boolean;
}

/** Producto del catálogo con las existencias reales de la sede del vendedor (GET /inventario/stock). */
export type ProductoCatalogoB2B = ProductoResponse & { stockSede: number };
