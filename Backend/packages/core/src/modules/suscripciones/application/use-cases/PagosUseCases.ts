/**
 * Casos de uso de pagos: iniciar el checkout de un plan y confirmar el resultado
 * de la pasarela (activa o renueva el plan; crea la empresa en la primera compra).
 */

import { DomainError, Result } from '@inventa/shared-kernel';
import type { EstadoPago, Pago, Plan } from '../../domain/entities/Suscripciones.ts';
import {
  AprovisionamientoFallidoError,
  CuentaNoEncontradaError,
  PagoNoEncontradoError,
  PlanNoEncontradoError,
} from '../../domain/errors/SuscripcionesErrors.ts';
import type {
  ICuentaRepository,
  IPagoRepository,
  IPlanRepository,
  ISuscripcionRepository,
} from '../../domain/repositories/ISuscripcionesPuertos.ts';

/** Pasarela de pagos (simulada hoy; Wompi/PayU mañana como otro adaptador). */
export interface IPasarelaPagos {
  readonly nombre: string;
  /** URL a la que se envía al cliente para pagar. */
  urlDePago(pago: Pago): string;
  /** Estado autoritativo de la transacción según la pasarela. */
  consultar(referencia: string): Promise<{ estado: EstadoPago; transaccionId: string | null }>;
}

/** Crea la empresa (base de datos propia) del primer plan que compra una cuenta. */
export interface IAprovisionadorEmpresas {
  crear(datos: {
    nombre: string;
    nit?: string | null;
    dueno: { nombre: string; email: string; passwordHash: string };
  }): Promise<{ empresaId: number }>;
  /** Olvida cachés de permisos/empresa tras activar o renovar. */
  invalidarCaches(empresaId: number): void;
}

export class DatosEmpresaRequeridosError extends DomainError {
  public readonly code = 'DATOS_EMPRESA_REQUERIDOS';
  constructor() {
    super('Indica el nombre de tu empresa para crearla con tu primer plan.');
  }
}

export interface CheckoutIniciado {
  referencia: string;
  urlPago: string;
  montoCentavos: number;
  plan: Pick<Plan, 'id' | 'nombre' | 'diasVigencia'>;
}

export class IniciarPagoUseCase {
  constructor(
    private readonly cuentas: ICuentaRepository,
    private readonly planes: IPlanRepository,
    private readonly pagos: IPagoRepository,
    private readonly pasarela: IPasarelaPagos,
  ) {}

  async execute(datos: { cuentaId: string; planId: string; nombreEmpresa?: string; nit?: string }): Promise<Result<CheckoutIniciado, DomainError>> {
    const cuenta = await this.cuentas.buscarPorId(datos.cuentaId);
    if (!cuenta) return Result.fail(new CuentaNoEncontradaError());
    const plan = await this.planes.buscar(datos.planId);
    if (!plan) return Result.fail(new PlanNoEncontradoError(datos.planId));

    const nombreEmpresa = datos.nombreEmpresa?.trim();
    if (cuenta.empresaId === null && (!nombreEmpresa || nombreEmpresa.length < 3)) {
      return Result.fail(new DatosEmpresaRequeridosError());
    }

    const referencia = `INV-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const pago = await this.pagos.crear({
      referencia,
      cuentaId: cuenta.id,
      planId: plan.id,
      // El monto sale SIEMPRE del catálogo del servidor, nunca del cliente.
      montoCentavos: plan.precioCentavos,
      pasarela: this.pasarela.nombre,
      detalle: cuenta.empresaId === null ? { nombreEmpresa, nit: datos.nit?.trim() || null } : null,
    });

    return Result.ok({
      referencia,
      urlPago: this.pasarela.urlDePago(pago),
      montoCentavos: pago.montoCentavos,
      plan: { id: plan.id, nombre: plan.nombre, diasVigencia: plan.diasVigencia },
    });
  }
}

export interface ResultadoConfirmacion {
  referencia: string;
  estado: EstadoPago;
  empresaId: number | null;
  venceEn: Date | null;
}

const DIA_MS = 24 * 60 * 60 * 1000;

export class ConfirmarPagoUseCase {
  constructor(
    private readonly cuentas: ICuentaRepository,
    private readonly planes: IPlanRepository,
    private readonly pagos: IPagoRepository,
    private readonly suscripciones: ISuscripcionRepository,
    private readonly pasarela: IPasarelaPagos,
    private readonly aprovisionador: IAprovisionadorEmpresas,
  ) {}

  /** Idempotente: confirmar dos veces el mismo pago no activa dos veces. */
  async execute(datos: { cuentaId: string; referencia: string; ahora?: Date }): Promise<Result<ResultadoConfirmacion, DomainError>> {
    let pago = await this.pagos.buscarPorReferencia(datos.referencia);
    if (!pago || pago.cuentaId !== datos.cuentaId) return Result.fail(new PagoNoEncontradoError());

    if (pago.estado === 'pendiente') {
      const { estado, transaccionId } = await this.pasarela.consultar(pago.referencia);
      if (estado !== 'pendiente') await this.pagos.marcarSiPendiente(pago.id, estado, transaccionId);
      pago = (await this.pagos.buscarPorReferencia(pago.referencia))!;
    }

    if (pago.estado !== 'aprobado') {
      return Result.ok({ referencia: pago.referencia, estado: pago.estado, empresaId: null, venceEn: null });
    }
    return this.activar(pago, datos.ahora ?? new Date());
  }

  /** Activa el plan pagado. Se puede repetir sin efectos dobles (suscripción única por pago). */
  private async activar(pago: Pago, ahora: Date): Promise<Result<ResultadoConfirmacion, DomainError>> {
    const cuenta = await this.cuentas.buscarPorId(pago.cuentaId);
    if (!cuenta) return Result.fail(new CuentaNoEncontradaError());
    const plan = await this.planes.buscar(pago.planId);
    if (!plan) return Result.fail(new PlanNoEncontradoError(pago.planId));

    let empresaId = cuenta.empresaId;
    if (empresaId === null) {
      try {
        const detalle = (pago.detalle ?? {}) as { nombreEmpresa?: string; nit?: string | null };
        const creada = await this.aprovisionador.crear({
          nombre: detalle.nombreEmpresa || `Empresa de ${cuenta.nombre}`,
          nit: detalle.nit ?? null,
          dueno: { nombre: cuenta.nombre, email: cuenta.email, passwordHash: cuenta.passwordHash },
        });
        empresaId = creada.empresaId;
        await this.cuentas.asignarEmpresa(cuenta.id, empresaId);
      } catch (error) {
        console.error('[ConfirmarPago] Falló el aprovisionamiento:', error);
        return Result.fail(new AprovisionamientoFallidoError());
      }
    }

    // Mismo plan vigente → se suma al final; plan distinto o vencido → empieza ya.
    const yaRegistrada = await this.suscripciones.buscarPorPago(pago.id);
    let venceEn = yaRegistrada?.venceEn ?? null;
    if (!yaRegistrada) {
      const vigente = await this.suscripciones.vigenteDeEmpresa(empresaId, ahora);
      const iniciaEn = vigente && vigente.planId === plan.id ? vigente.venceEn : ahora;
      venceEn = new Date(iniciaEn.getTime() + plan.diasVigencia * DIA_MS);
      await this.suscripciones.registrar({ empresaId, planId: plan.id, pagoId: pago.id, iniciaEn, venceEn });
    }
    this.aprovisionador.invalidarCaches(empresaId);

    return Result.ok({ referencia: pago.referencia, estado: 'aprobado', empresaId, venceEn });
  }
}

export interface PagoConsultado {
  referencia: string;
  estado: EstadoPago;
  montoCentavos: number;
  plan: { id: string; nombre: string; diasVigencia: number };
  nombreEmpresa: string | null;
  motivoRechazo: string | null;
}

/** Datos de un pago de la cuenta (para la página de pago y la de resultado). */
export class ConsultarPagoUseCase {
  constructor(
    private readonly pagos: IPagoRepository,
    private readonly planes: IPlanRepository,
  ) {}

  async execute(datos: { cuentaId: string; referencia: string }): Promise<Result<PagoConsultado, DomainError>> {
    const pago = await this.pagos.buscarPorReferencia(datos.referencia);
    if (!pago || pago.cuentaId !== datos.cuentaId) return Result.fail(new PagoNoEncontradoError());
    const plan = await this.planes.buscar(pago.planId);
    const detalle = (pago.detalle ?? {}) as { nombreEmpresa?: string; simulacion?: { motivo?: string | null } };
    return Result.ok({
      referencia: pago.referencia,
      estado: pago.estado,
      montoCentavos: pago.montoCentavos,
      plan: { id: pago.planId, nombre: plan?.nombre ?? pago.planId, diasVigencia: plan?.diasVigencia ?? 30 },
      nombreEmpresa: detalle.nombreEmpresa ?? null,
      motivoRechazo: detalle.simulacion?.motivo ?? null,
    });
  }
}
