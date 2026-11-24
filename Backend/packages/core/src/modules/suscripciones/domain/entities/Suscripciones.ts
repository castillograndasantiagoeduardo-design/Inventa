/**
 * Entidades del módulo de suscripciones (base central, transversal a las empresas).
 */

/** Cuenta creada desde la web. Gratuita mientras empresaId es null. */
export interface Cuenta {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  empresaId: number | null;
  creadaEn: Date;
}

/** Plan comercial con su tope de permisos. */
export interface Plan {
  id: string;
  nombre: string;
  etiqueta: string;
  descripcion: string;
  precioCentavos: number;
  diasVigencia: number;
  maxSucursales: number | null;
  orden: number;
  permisos: string[];
}

/** Plan vigente de una empresa. */
export interface SuscripcionVigente {
  empresaId: number;
  planId: string;
  iniciaEn: Date;
  venceEn: Date;
}

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'expirado';

/** Intento de pago de un plan. */
export interface Pago {
  id: string;
  referencia: string;
  cuentaId: string;
  planId: string;
  montoCentavos: number;
  moneda: string;
  pasarela: string;
  estado: EstadoPago;
  transaccionExterna: string | null;
  creadoEn: Date;
}
