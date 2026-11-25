import { DomainError, Result } from '@inventa/shared-kernel';
import type { AvisoPagoCreditoDto } from '@inventa/contracts';
import type { ICarteraRepository } from '../../domain/repositories/ICarteraRepository.ts';
import {
  AvisoDuplicadoPendienteError,
  CreditoB2BNoEncontradoError,
  CreditoYaPagadoError,
  MontoSuperaSaldoError,
  PagoInvalidoError,
} from '../../domain/errors/FacturacionErrors.ts';
import type { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  type ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface AvisarPagoCreditoRequest {
  creditoId: string;
  monto: number;
  referencia: string;
  nota?: string | null;
  actor: ActorAuditoria;
}

/**
 * Caso de uso del Vendedor B2B para reportar un aviso de pago sobre una obligación de crédito.
 *
 * Regla de separación de funciones:
 * - El vendedor NO puede modificar el saldo del crédito ni liberar cupo directamente.
 * - Solo crea un aviso en estado `pendiente` adjuntando monto y referencia bancaria/recibo.
 * - Impide avisos duplicados con la misma referencia mientras exista uno pendiente para ese crédito.
 */
export class AvisarPagoCreditoUseCase {
  constructor(
    private readonly carteraRepository: ICarteraRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: AvisarPagoCreditoRequest,
  ): Promise<Result<AvisoPagoCreditoDto, DomainError>> {
    const credito = await this.carteraRepository.obtenerCreditoPorId(request.creditoId);
    if (!credito) {
      return Result.fail(new CreditoB2BNoEncontradoError());
    }

    if (credito.estaPagado) {
      return Result.fail(new CreditoYaPagadoError());
    }

    const monto = Math.round(Number(request.monto) * 100) / 100;
    if (!Number.isFinite(monto) || monto <= 0) {
      return Result.fail(new PagoInvalidoError('El monto del aviso de pago debe ser mayor a 0.'));
    }

    if (monto > credito.saldo + 0.001) {
      return Result.fail(new MontoSuperaSaldoError(credito.saldo, monto));
    }

    const referencia = request.referencia?.trim() ?? '';
    if (referencia.length < 3) {
      return Result.fail(
        new PagoInvalidoError('La referencia de pago debe tener al menos 3 caracteres.'),
      );
    }

    const duplicado = await this.carteraRepository.existeAvisoPendienteConReferencia(
      credito.id,
      referencia,
    );
    if (duplicado) {
      return Result.fail(new AvisoDuplicadoPendienteError(referencia));
    }

    const montoReportado = Math.min(credito.saldo, monto);

    const aviso = await this.carteraRepository.crearAvisoPago({
      creditoId: credito.id,
      monto: montoReportado,
      referencia,
      nota: request.nota?.trim() || null,
      avisadoPor: request.actor.usuarioId,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.AVISOS_PAGO_CREDITO_B2B,
      entidadId: aviso.id,
      detalles: {
        despues: {
          creditoId: aviso.creditoId,
          clienteId: aviso.clienteId,
          monto: aviso.monto,
          referencia: aviso.referencia,
          estado: aviso.estado,
        },
      },
    });

    return Result.ok(aviso);
  }
}
