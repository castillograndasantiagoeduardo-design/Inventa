import type { Cuenta, EstadoPago, Pago, Plan, SuscripcionVigente } from '../entities/Suscripciones.ts';
import type { LogoValidado, MarcaEmpresa } from '../services/IAnalizadorLogo.ts';

export interface ICuentaRepository {
  buscarPorEmail(email: string): Promise<Cuenta | null>;
  buscarPorId(id: string): Promise<Cuenta | null>;
  /** true si el correo ya está en una cuenta o en el directorio de alguna empresa. */
  correoOcupado(email: string): Promise<boolean>;
  crear(datos: { email: string; nombre: string; passwordHash: string; logo?: LogoValidado | null }): Promise<Cuenta>;
  /** Vincula la empresa creada y le copia la marca (logo y color) de la cuenta. */
  asignarEmpresa(cuentaId: string, empresaId: number): Promise<void>;
  /** Cambia el logo de la cuenta y, si ya tiene empresa, también el de la empresa. */
  actualizarLogo(cuentaId: string, logo: LogoValidado): Promise<void>;
  obtenerLogo(cuentaId: string): Promise<Uint8Array | null>;
}

/** Marca (logo y color) de las empresas, para pintar su panel. */
export interface IMarcaEmpresaRepository {
  obtener(empresaId: number): Promise<MarcaEmpresa | null>;
  obtenerLogo(empresaId: number): Promise<Uint8Array | null>;
  /** Actualiza el logo y color de la empresa (y sincroniza la cuenta asociada si existe). Devuelve false si la empresa no existe. */
  actualizarLogo(empresaId: number, logo: LogoValidado): Promise<boolean>;
}

export interface IPlanRepository {
  listarActivos(): Promise<Plan[]>;
  buscar(planId: string): Promise<Plan | null>;
}

export interface ISuscripcionRepository {
  vigenteDeEmpresa(empresaId: number, ahora?: Date): Promise<SuscripcionVigente | null>;
  /** Crea el periodo pagado. Idempotente por pagoId. */
  registrar(datos: { empresaId: number; planId: string; pagoId: string; iniciaEn: Date; venceEn: Date }): Promise<void>;
  /** Periodo creado por un pago (para no activarlo dos veces). */
  buscarPorPago(pagoId: string): Promise<{ empresaId: number; venceEn: Date } | null>;
}

export interface IPagoRepository {
  crear(datos: { referencia: string; cuentaId: string; planId: string; montoCentavos: number; pasarela: string; detalle?: Record<string, unknown> | null }): Promise<Pago>;
  /** Mezcla datos en el detalle JSON del pago (ej. resultado de la pasarela). */
  agregarDetalle(referencia: string, datos: Record<string, unknown>): Promise<void>;
  buscarPorReferencia(referencia: string): Promise<Pago | null>;
  /**
   * Cambia el estado solo si el pago sigue pendiente (evita procesarlo dos veces).
   * Devuelve true si este llamado hizo el cambio.
   */
  marcarSiPendiente(pagoId: string, estado: Exclude<EstadoPago, 'pendiente'>, transaccionExterna: string | null): Promise<boolean>;
}
