import { z } from 'zod';
import {
  ESTADOS_CREDITO_CLIENTE,
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
  avisosPago: AvisoPagoCreditoDto[];
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

/**
 * Resumen consolidado de cartera corporativa B2B de la sucursal.
 */
export interface ResumenCarteraDto {
  totalEmpresasB2B: number;
  empresasConCredito: number;
  cupoTotalAprobado: number;
  cupoTotalUtilizado: number;
  cupoTotalDisponible: number;
  saldoTotalPendiente: number;
  montoTotalVencido: number;
  empresasEnMora: number;
  creditosVigentesCount: number;
  creditosPagadosCount: number;
  gananciaTotalGenerada: number;
  avisosPendientesCount: number;
}

/**
 * Resumen de una empresa con obligaciones vencidas (en mora).
 */
export interface EmpresaEnMoraDto {
  clienteId: string;
  nombreRazonSocial: string;
  tipoDocumento: TipoDocumentoCliente;
  numeroDocumento: string;
  telefono: string | null;
  montoVencido: number;
  diasMoraMax: number;
  creditosVencidosCount: number;
  creditoMasAntiguoVencido: string;
}

const booleanoOpcional = (valor: unknown) => {
  if (valor === undefined || valor === null || valor === '') return undefined;
  if (typeof valor === 'boolean') return valor;
  if (valor === 'true' || valor === '1') return true;
  if (valor === 'false' || valor === '0') return false;
  return valor;
};

export const filtrosEmpresasB2BSchema = z.object({
  buscar: z.preprocess(textoOpcionalCartera, z.string().trim().max(100).optional()),
  estadoCredito: z.preprocess(
    textoOpcionalCartera,
    z.enum(ESTADOS_CREDITO_CLIENTE).optional(),
  ),
  soloEnMora: z.preprocess(booleanoOpcional, z.boolean().optional()),
  conCartera: z.preprocess(booleanoOpcional, z.boolean().optional()),
});

export type FiltrosEmpresasB2B = z.infer<typeof filtrosEmpresasB2BSchema>;

export const filtrosCarteraB2BSchema = z.object({
  clienteId: z.preprocess(textoOpcionalCartera, z.string().uuid().optional()),
  estado: z.preprocess(textoOpcionalCartera, z.enum(ESTADOS_CARTERA_B2B).optional()),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

export type FiltrosCarteraB2B = z.infer<typeof filtrosCarteraB2BSchema>;

/**
 * Aviso de pago reportado por el vendedor B2B para revisión del admin de sucursal.
 */
export interface AvisoPagoCreditoDto {
  id: string;
  creditoId: string;
  facturaId: string;
  facturaConsecutivo: number;
  clienteId: string;
  clienteNombre: string;
  sucursalId: number;
  monto: number;
  saldoActualCredito: number;
  referencia: string;
  nota: string | null;
  estado: EstadoAvisoPago;
  avisadoPor: string;
  avisadoPorNombre: string | null;
  fechaAviso: string;
  revisadoPor: string | null;
  revisadoPorNombre: string | null;
  fechaRevision: string | null;
  motivoRechazo: string | null;
}

export const avisarPagoCreditoSchema = z.object({
  monto: z.coerce
    .number({ required_error: 'El monto del pago es obligatorio.' })
    .positive({ message: 'El monto debe ser mayor a 0.' })
    .max(999_999_999_999),
  referencia: z
    .string({ required_error: 'La referencia de pago es obligatoria.' })
    .trim()
    .min(3, { message: 'La referencia debe tener al menos 3 caracteres.' })
    .max(100, { message: 'La referencia no puede exceder 100 caracteres.' }),
  nota: z.preprocess(
    textoOpcionalCartera,
    z.string().trim().max(300, { message: 'La nota no puede exceder 300 caracteres.' }).optional(),
  ),
});

export type AvisarPagoInput = z.infer<typeof avisarPagoCreditoSchema>;

export const resolverAvisoPagoSchema = z
  .object({
    decision: z.enum(['confirmar', 'rechazar'], {
      message: 'La decisión debe ser confirmar o rechazar.',
    }),
    motivoRechazo: z.preprocess(
      textoOpcionalCartera,
      z.string().trim().max(300, { message: 'El motivo de rechazo no puede exceder 300 caracteres.' }).optional(),
    ),
  })
  .superRefine((datos, ctx) => {
    if (datos.decision === 'rechazar' && (!datos.motivoRechazo || datos.motivoRechazo.trim().length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivoRechazo'],
        message: 'Debes indicar un motivo de rechazo (mínimo 5 caracteres).',
      });
    }
  });

export type ResolverAvisoInput = z.infer<typeof resolverAvisoPagoSchema>;

export const filtrosAvisosPagoSchema = z.object({
  estado: z.preprocess(textoOpcionalCartera, z.enum(ESTADOS_AVISO_PAGO).optional()),
  clienteId: z.preprocess(textoOpcionalCartera, z.string().uuid().optional()),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

export type FiltrosAvisosPago = z.infer<typeof filtrosAvisosPagoSchema>;
