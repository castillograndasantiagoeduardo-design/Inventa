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
