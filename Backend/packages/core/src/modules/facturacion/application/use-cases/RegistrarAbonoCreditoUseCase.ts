import { DomainError, Result } from '@inventa/shared-kernel';
import type { AbonoCreditoDto, CreditoB2BDto } from '@inventa/contracts';
import type { ICarteraRepository } from '../../domain/repositories/ICarteraRepository.ts';
import {
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

export interface RegistrarAbonoCreditoRequest {
  creditoId: string;
  monto: number;
  actor: ActorAuditoria;
}

export interface RegistrarAbonoCreditoResultado {
  abono: AbonoCreditoDto;
  credito: CreditoB2BDto;
}

/**
 * Caso de uso administrativo para registrar un abono directo sobre una obligación de cartera B2B.
 *
 * Reglas de negocio:
 * - Solo el Administrador de Sucursal o Super Admin ejecuta este caso de uso (permiso `facturacion:registrar-abono-credito`).
 * - Valida que el crédito exista, no esté pagado y que `0 < monto <= saldo`.
 * - Aplica el abono atómicamente vía Unit of Work: inserta en `abonos_credito_b2b`, descuenta
 *   el saldo en `creditos_b2b` (marcando `pagado` si llega a 0) y libera `cupo_credito_utilizado` del cliente.
 * - Registra auditoría `{ antes, despues }` en `abonos_credito_b2b`.
 */
export class RegistrarAbonoCreditoUseCase {
  constructor(
    private readonly carteraRepository: ICarteraRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: RegistrarAbonoCreditoRequest,
  ): Promise<Result<RegistrarAbonoCreditoResultado, DomainError>> {
    const credito = await this.carteraRepository.obtenerCreditoPorId(request.creditoId);
    if (!credito) {
      return Result.fail(new CreditoB2BNoEncontradoError());
    }

    if (credito.estaPagado) {
      return Result.fail(new CreditoYaPagadoError());
    }

    const montoAbono = Math.round(Number(request.monto) * 100) / 100;
    if (!Number.isFinite(montoAbono) || montoAbono <= 0) {
      return Result.fail(new PagoInvalidoError('El monto del abono debe ser mayor a 0.'));
    }

    if (montoAbono > credito.saldo + 0.001) {
      return Result.fail(new MontoSuperaSaldoError(credito.saldo, montoAbono));
    }

    const montoAplicado = Math.min(credito.saldo, montoAbono);

    const resultado = await this.carteraRepository.registrarAbonoAtomico({
      creditoId: credito.id,
      clienteId: credito.clienteId,
      monto: montoAplicado,
      registradoPor: request.actor.usuarioId,
      avisoId: null,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.ABONOS_CREDITO_B2B,
      entidadId: resultado.abono.id,
      detalles: {
        antes: {
          saldoCredito: credito.saldo,
          estadoCredito: credito.estadoPersistido,
          cupoUtilizadoCliente: resultado.cupoUtilizadoAntes,
        },
        despues: {
          creditoId: credito.id,
          clienteId: credito.clienteId,
          montoAbono: montoAplicado,
          saldoCredito: resultado.creditoActualizado.saldo,
          estadoCredito: resultado.creditoActualizado.estadoPersistido,
          cupoUtilizadoCliente: resultado.cupoUtilizadoDespues,
        },
      },
    });

    return Result.ok({
      abono: resultado.abono,
      credito: resultado.creditoActualizado.toDTO(),
    });
  }
}
