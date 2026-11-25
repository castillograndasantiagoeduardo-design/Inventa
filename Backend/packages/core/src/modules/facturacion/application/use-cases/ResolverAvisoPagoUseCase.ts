import { DomainError, Result } from '@inventa/shared-kernel';
import type {
  AbonoCreditoDto,
  AvisoPagoCreditoDto,
  CreditoB2BDto,
} from '@inventa/contracts';
import type { ICarteraRepository } from '../../domain/repositories/ICarteraRepository.ts';
import {
  AvisoNoEncontradoError,
  AvisoYaResueltoError,
  CreditoB2BNoEncontradoError,
  CreditoYaPagadoError,
  MontoSuperaSaldoError,
  MotivoRechazoRequeridoError,
} from '../../domain/errors/FacturacionErrors.ts';
import type { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  type ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface ResolverAvisoPagoRequest {
  avisoId: string;
  decision: 'confirmar' | 'rechazar';
  motivoRechazo?: string | null;
  actor: ActorAuditoria;
}

export interface ResolverAvisoPagoResultado {
  decision: 'confirmar' | 'rechazar';
  aviso: AvisoPagoCreditoDto;
  abono?: AbonoCreditoDto;
  credito?: CreditoB2BDto;
}

/**
 * Caso de uso exclusivo del Administrador de Sucursal / Super Admin para resolver
 * un aviso de pago reportado por el Vendedor B2B.
 *
 * - `confirmar`: registra el abono atómicamente vinculado al `avisoId`, reduce el saldo del crédito,
 *   libera cupo del cliente y marca el aviso como `confirmado`.
 * - `rechazar`: requiere motivo mínimo de 5 caracteres y marca el aviso como `rechazado` sin tocar saldos.
 * - Impide resolver un aviso que ya no esté en estado `pendiente`.
 */
export class ResolverAvisoPagoUseCase {
  constructor(
    private readonly carteraRepository: ICarteraRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: ResolverAvisoPagoRequest,
  ): Promise<Result<ResolverAvisoPagoResultado, DomainError>> {
    const aviso = await this.carteraRepository.obtenerAvisoPorId(request.avisoId);
    if (!aviso) {
      return Result.fail(new AvisoNoEncontradoError());
    }

    if (aviso.estado !== 'pendiente') {
      return Result.fail(new AvisoYaResueltoError());
    }

    if (request.decision === 'rechazar') {
      const motivo = request.motivoRechazo?.trim() ?? '';
      if (motivo.length < 5) {
        return Result.fail(new MotivoRechazoRequeridoError());
      }

      const avisoRechazado = await this.carteraRepository.rechazarAvisoPago({
        avisoId: aviso.id,
        revisadoPor: request.actor.usuarioId,
        motivoRechazo: motivo,
      });

      await this.auditor.registrar({
        actor: request.actor,
        accion: ACCIONES_AUDITORIA.EDITAR,
        entidad: ENTIDADES_AUDITORIA.AVISOS_PAGO_CREDITO_B2B,
        entidadId: aviso.id,
        detalles: {
          antes: { estado: aviso.estado },
          despues: {
            estado: 'rechazado',
            motivoRechazo: motivo,
            creditoId: aviso.creditoId,
            monto: aviso.monto,
          },
        },
      });

      return Result.ok({
        decision: 'rechazar',
        aviso: avisoRechazado,
      });
    }

    const credito = await this.carteraRepository.obtenerCreditoPorId(aviso.creditoId);
    if (!credito) {
      return Result.fail(new CreditoB2BNoEncontradoError());
    }
    if (credito.estaPagado) {
      return Result.fail(new CreditoYaPagadoError());
    }
    if (aviso.monto > credito.saldo + 0.001) {
      return Result.fail(new MontoSuperaSaldoError(credito.saldo, aviso.monto));
    }

    const montoAplicado = Math.min(credito.saldo, aviso.monto);
    const abonoRes = await this.carteraRepository.registrarAbonoAtomico({
      creditoId: credito.id,
      clienteId: credito.clienteId,
      monto: montoAplicado,
      registradoPor: request.actor.usuarioId,
      avisoId: aviso.id,
    });

    const avisoActualizado =
      (await this.carteraRepository.obtenerAvisoPorId(aviso.id)) ?? {
        ...aviso,
        estado: 'confirmado' as const,
        revisadoPor: request.actor.usuarioId,
        fechaRevision: new Date().toISOString(),
        saldoActualCredito: abonoRes.creditoActualizado.saldo,
      };

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.AVISOS_PAGO_CREDITO_B2B,
      entidadId: aviso.id,
      detalles: {
        antes: {
          estado: aviso.estado,
          saldoCredito: credito.saldo,
          cupoUtilizadoCliente: abonoRes.cupoUtilizadoAntes,
        },
        despues: {
          estado: 'confirmado',
          abonoId: abonoRes.abono.id,
          montoAbono: abonoRes.abono.monto,
          saldoCredito: abonoRes.creditoActualizado.saldo,
          cupoUtilizadoCliente: abonoRes.cupoUtilizadoDespues,
        },
      },
    });

    return Result.ok({
      decision: 'confirmar',
      aviso: avisoActualizado,
      abono: abonoRes.abono,
      credito: abonoRes.creditoActualizado.toDTO(),
    });
  }
}
