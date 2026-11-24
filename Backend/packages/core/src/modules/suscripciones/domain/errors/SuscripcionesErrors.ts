import { DomainError } from '@inventa/shared-kernel';

export class CorreoYaRegistradoError extends DomainError {
  public readonly code = 'EMAIL_YA_REGISTRADO';
  constructor() {
    super('Ya existe una cuenta o un usuario con ese correo.');
  }
}

export class CuentaNoEncontradaError extends DomainError {
  public readonly code = 'CUENTA_NO_ENCONTRADA';
  constructor() {
    super('La cuenta no existe.');
  }
}

export class PlanNoEncontradoError extends DomainError {
  public readonly code = 'PLAN_NO_ENCONTRADO';
  constructor(planId: string) {
    super(`El plan "${planId}" no existe o no está disponible.`);
  }
}

export class PagoNoEncontradoError extends DomainError {
  public readonly code = 'PAGO_NO_ENCONTRADO';
  constructor() {
    super('El pago no existe o no pertenece a tu cuenta.');
  }
}

export class PagoNoAprobadoError extends DomainError {
  public readonly code = 'PAGO_NO_APROBADO';
  constructor(estado: string) {
    super(`El pago no fue aprobado (estado: ${estado}).`);
  }
}

export class AprovisionamientoFallidoError extends DomainError {
  public readonly code = 'APROVISIONAMIENTO_FALLIDO';
  constructor() {
    super('El pago fue aprobado, pero no se pudo crear tu empresa. Nuestro equipo lo revisará; no se te cobrará de nuevo.');
  }
}

export class LogoInvalidoError extends DomainError {
  public readonly code = 'LOGO_INVALIDO';
  constructor(motivo: string) {
    super(motivo);
  }
}

export class EmpresaNoEncontradaError extends DomainError {
  public readonly code = 'EMPRESA_NO_ENCONTRADA';
  constructor() {
    super('La empresa activa no existe en el registro central.');
  }
}
