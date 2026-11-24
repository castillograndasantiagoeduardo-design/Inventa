import { z } from 'zod';

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
