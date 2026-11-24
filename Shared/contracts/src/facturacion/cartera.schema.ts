import { z } from 'zod';
import {
  PLAZOS_CREDITO_DIAS,
  type EstadoCreditoCliente,
  type NivelRiesgoCredito,
  type PlazoCreditoDias,
  type TipoDocumentoCliente,
} from './cliente.schema.ts';

/**
 * Estados de una obligación de crédito corporativo B2B.
 * - `vigente`: saldo > 0 y fecha_vencimiento >= hoy
 * - `en_mora`: estado derivado cuando saldo > 0 y fecha_vencimiento < hoy
 * - `pagado`: saldo === 0
 */
export const ESTADOS_CARTERA_B2B = ['vigente', 'pagado', 'en_mora'] as const;
export type EstadoCarteraB2B = (typeof ESTADOS_CARTERA_B2B)[number];

/**
 * Estados persistidos en la tabla `creditos_b2b` (la mora se deriva por fecha).
 */
export const ESTADOS_CREDITO_PERSISTIDO = ['vigente', 'pagado'] as const;
export type EstadoCreditoPersistido = (typeof ESTADOS_CREDITO_PERSISTIDO)[number];

/**
 * Estados de un aviso de pago emitido por el vendedor B2B.
 */
export const ESTADOS_AVISO_PAGO = ['pendiente', 'confirmado', 'rechazado'] as const;
export type EstadoAvisoPago = (typeof ESTADOS_AVISO_PAGO)[number];

/**
 * Representación de una obligación de crédito B2B derivada de una factura a crédito.
 */
export interface CreditoB2BDto {
  id: string;
  facturaId: string;
  facturaConsecutivo: number;
  clienteId: string;
  clienteNombre: string;
  sucursalId: number;
  monto: number;
  saldo: number;
  totalAbonado: number;
  fechaEmision: string;
  fechaVencimiento: string;
  estado: EstadoCarteraB2B;
  diasMora: number;
  diasTranscurridos: number;
  createdAt: string;
}

/**
 * Abono aplicado a un crédito corporativo B2B (inmutable / append-only).
 */
export interface AbonoCreditoDto {
  id: string;
  creditoId: string;
  monto: number;
  fecha: string;
  registradoPor: string;
  registradoPorNombre?: string | null;
  avisoId: string | null;
}

export const registrarAbonoCreditoSchema = z.object({
  monto: z.coerce
    .number({ required_error: 'El monto del abono es obligatorio.' })
    .positive({ message: 'El monto del abono debe ser mayor a 0.' })
    .max(999_999_999_999),
});

export type RegistrarAbonoCreditoInput = z.infer<typeof registrarAbonoCreditoSchema>;

/**
 * Resumen financiero, crediticio y de rentabilidad de una empresa B2B.
 */
export interface EmpresaB2BResumenDto {
  id: string;
  tipoDocumento: TipoDocumentoCliente;
  numeroDocumento: string;
  nombreRazonSocial: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  creditoHabilitado: boolean;
  estadoCredito: EstadoCreditoCliente;
  nivelRiesgoCredito: NivelRiesgoCredito | null;
  plazoCreditoDias: number | null;
  cupoCreditoSugerido: number;
  cupoCreditoAprobado: number;
  cupoCreditoUtilizado: number;
  cupoCreditoDisponible: number;
  saldoPendiente: number;
  gananciaNetaMensual: number | null;
  antiguedadEmpresaMeses: number | null;
  observacionFinanciera: string | null;
  motivoDecisionCredito: string | null;
  // Rentabilidad frente al crédito (calculada desde facturas emitidas - devoluciones)
  totalFacturado: number;
  totalDevoluciones: number;
  gananciaGenerada: number;
  rentabilidadSobreCredito: number | null;
  // Resumen de cartera
  creditosVigentesCount: number;
  creditosPagadosCount: number;
  creditosEnMoraCount: number;
  montoVencido: number;
  diasMoraMax: number;
  antiguedadCarteraDias: number | null;
  avisosPendientesCount: number;
}

/**
 * Detalle completo de una empresa B2B con su historial de créditos y abonos.
 */
export interface EmpresaB2BDetalleDto extends EmpresaB2BResumenDto {
  creditos: CreditoB2BDto[];
  abonosRecientes: AbonoCreditoDto[];
}

const numeroOpcionalCartera = (valor: unknown) => {
  if (valor === '' || valor === null || valor === undefined) return undefined;
  const parsed = Number(valor);
  return Number.isNaN(parsed) ? valor : parsed;
};

const textoOpcionalCartera = (valor: unknown) =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;

/**
 * Solicitud de crédito corporativo B2B ("Soltar crédito") para una empresa existente.
 */
export const solicitarCreditoB2BSchema = z.object({
  gananciaNetaMensual: z.coerce
    .number({ required_error: 'La ganancia neta mensual es obligatoria.' })
    .positive({ message: 'La ganancia neta mensual debe ser mayor a 0.' })
    .max(999_999_999_999),
  antiguedadEmpresaMeses: z.preprocess(
    numeroOpcionalCartera,
    z.number().int().min(0, { message: 'La antigüedad no puede ser negativa.' }).max(1200).optional(),
  ),
  plazoCreditoDias: z.preprocess(
    numeroOpcionalCartera,
    z
      .number()
      .int()
      .refine((v): v is PlazoCreditoDias => (PLAZOS_CREDITO_DIAS as readonly number[]).includes(v), {
        message: 'El plazo de crédito debe ser 15, 30, 45 o 60 días.',
      })
      .default(30),
  ),
  observacionFinanciera: z.preprocess(
    textoOpcionalCartera,
    z.string().trim().max(500, { message: 'La observación financiera no puede exceder 500 caracteres.' }).optional(),
  ),
});

export type SolicitarCreditoB2BInput = z.infer<typeof solicitarCreditoB2BSchema>;
