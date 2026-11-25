import { DomainError, Result } from '@inventa/shared-kernel';
import type { EvaluacionCreditoB2BDto, PlazoCreditoDias } from '@inventa/contracts';
import type { Cliente } from '../../domain/entities/Cliente.ts';
import type { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import type { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { EvaluadorCreditoB2B } from '../../domain/services/EvaluadorCreditoB2B.ts';
import {
  ClienteNoEncontradoError,
  ClienteRequeridoParaVentaB2BError,
  DecisionCreditoInvalidaError,
} from '../../domain/errors/FacturacionErrors.ts';
import type { IAlertaAdminRepository } from '../../../administracion/domain/repositories/IAlertaAdminRepository.ts';
import type { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  type ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface SolicitarCreditoB2BRequest {
  clienteId: string;
  gananciaNetaMensual: number;
  antiguedadEmpresaMeses?: number | null;
  plazoCreditoDias?: PlazoCreditoDias | null;
  observacionFinanciera?: string | null;
  actor: ActorAuditoria;
}

export interface SolicitarCreditoB2BResultado {
  cliente: Cliente;
  evaluacionCredito: EvaluacionCreditoB2BDto;
  alertaSuperAdminEnviada: boolean;
}

/**
 * Caso de uso para "Soltar crédito" desde el panel del Vendedor B2B sobre una empresa ya registrada.
 *
 * Reglas de negocio:
 * - Solo aplica a clientes corporativos (B2B).
 * - Si la empresa ya tiene un crédito aprobado/habilitado, no puede reabrirse como solicitud.
 * - Exige datos de ganancia neta mensual y calcula el cupo sugerido con `EvaluadorCreditoB2B`.
 * - Deja la solicitud en `pendiente_aprobacion` con `creditoHabilitado = false`;
 *   la aprobación final sigue siendo exclusiva del flujo existente (`PUT /clientes/:id/credito`).
 * - Emite alerta urgente al Super Admin y registra auditoría `{ antes, despues }`.
 */
export class SolicitarCreditoB2BUseCase {
  constructor(
    private readonly clienteRepository: IClienteRepository,
    private readonly auditor: IAuditor,
    private readonly alertaAdminRepository?: IAlertaAdminRepository,
    private readonly sucursalOperadorRepository?: ISucursalOperadorRepository,
    private readonly topeCreditoPolitica: number = EvaluadorCreditoB2B.TOPE_POLITICA_DEFAULT,
  ) {}

  public async execute(
    request: SolicitarCreditoB2BRequest,
  ): Promise<Result<SolicitarCreditoB2BResultado, DomainError>> {
    const cliente = await this.clienteRepository.findById(request.clienteId);
    if (!cliente) {
      return Result.fail(new ClienteNoEncontradoError());
    }

    if (!cliente.esB2B) {
      return Result.fail(
        new ClienteRequeridoParaVentaB2BError(
          'Solo las empresas corporativas (B2B) pueden solicitar crédito.',
        ),
      );
    }

    if (cliente.estadoCredito === 'aprobado' || cliente.creditoHabilitado) {
      return Result.fail(
        new DecisionCreditoInvalidaError(
          'Esta empresa ya cuenta con crédito corporativo aprobado.',
        ),
      );
    }

    if (!this.clienteRepository.solicitarCredito) {
      return Result.fail(
        new DecisionCreditoInvalidaError(
          'El repositorio actual no soporta el registro de solicitudes de crédito.',
        ),
      );
    }

    const evaluacion = EvaluadorCreditoB2B.evaluar({
      gananciaNetaMensual: request.gananciaNetaMensual,
      antiguedadEmpresaMeses: request.antiguedadEmpresaMeses ?? null,
      plazoCreditoDias: request.plazoCreditoDias ?? 30,
      topePoliticaMaximo: this.topeCreditoPolitica,
    });

    const observacion = request.observacionFinanciera?.trim() || null;

    const actualizado = await this.clienteRepository.solicitarCredito(cliente.id, {
      gananciaNetaMensual: evaluacion.gananciaNetaMensual,
      antiguedadEmpresaMeses: evaluacion.antiguedadEmpresaMeses,
      plazoCreditoDias: evaluacion.plazoCreditoDias,
      cupoCreditoSugerido: evaluacion.cupoSugerido,
      nivelRiesgoCredito: evaluacion.nivelRiesgo,
      estadoCredito: 'pendiente_aprobacion',
      observacionFinanciera: observacion,
    });

    let alertaSuperAdminEnviada = false;
    if (this.alertaAdminRepository) {
      const sucursalOperador = this.sucursalOperadorRepository
        ? await this.sucursalOperadorRepository.obtenerSucursalId(request.actor.usuarioId)
        : null;
      const sucursalId = sucursalOperador ?? 1;

      const marcadorCliente = ` [clienteId:${cliente.id}]`;
      const cuerpoDescripcion = [
        `SOLICITUD DE CRÉDITO B2B ("Soltar crédito") — Empresa: ${cliente.nombreRazonSocial}.`,
        `Ganancia neta mensual: $${evaluacion.gananciaNetaMensual.toLocaleString('es-CO')} COP.`,
        `Cupo sugerido: $${evaluacion.cupoSugerido.toLocaleString('es-CO')} COP (Riesgo: ${evaluacion.nivelRiesgo.toUpperCase()}, Plazo: ${evaluacion.plazoCreditoDias} días).`,
        `Pendiente de aprobación.`,
      ].join(' ');
      const descripcion = `${cuerpoDescripcion.slice(0, 500 - marcadorCliente.length)}${marcadorCliente}`;

      await this.alertaAdminRepository.crear({
        usuarioId: request.actor.usuarioId,
        sucursalId,
        motivo: 'SOLICITUD_CREDITO_B2B',
        prioridad: 'urgente',
        descripcion,
        destinatarioRol: 'super-admin',
      });
      alertaSuperAdminEnviada = true;
    }

    const antes: Record<string, unknown> = {};
    const despues: Record<string, unknown> = {};

    if (cliente.estadoCredito !== actualizado.estadoCredito) {
      antes.estadoCredito = cliente.estadoCredito;
      despues.estadoCredito = actualizado.estadoCredito;
    }
    if (cliente.gananciaNetaMensual !== actualizado.gananciaNetaMensual) {
      antes.gananciaNetaMensual = cliente.gananciaNetaMensual;
      despues.gananciaNetaMensual = actualizado.gananciaNetaMensual;
    }
    if (cliente.antiguedadEmpresaMeses !== actualizado.antiguedadEmpresaMeses) {
      antes.antiguedadEmpresaMeses = cliente.antiguedadEmpresaMeses;
      despues.antiguedadEmpresaMeses = actualizado.antiguedadEmpresaMeses;
    }
    if (cliente.plazoCreditoDias !== actualizado.plazoCreditoDias) {
      antes.plazoCreditoDias = cliente.plazoCreditoDias;
      despues.plazoCreditoDias = actualizado.plazoCreditoDias;
    }
    if (cliente.cupoCreditoSugerido !== actualizado.cupoCreditoSugerido) {
      antes.cupoCreditoSugerido = cliente.cupoCreditoSugerido;
      despues.cupoCreditoSugerido = actualizado.cupoCreditoSugerido;
    }
    if (cliente.nivelRiesgoCredito !== actualizado.nivelRiesgoCredito) {
      antes.nivelRiesgoCredito = cliente.nivelRiesgoCredito;
      despues.nivelRiesgoCredito = actualizado.nivelRiesgoCredito;
    }
    if (cliente.observacionFinanciera !== actualizado.observacionFinanciera) {
      antes.observacionFinanciera = cliente.observacionFinanciera;
      despues.observacionFinanciera = actualizado.observacionFinanciera;
    }

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.EDITAR,
      entidad: ENTIDADES_AUDITORIA.CLIENTES,
      entidadId: actualizado.id,
      detalles: { antes, despues },
    });

    return Result.ok({
      cliente: actualizado,
      evaluacionCredito: evaluacion,
      alertaSuperAdminEnviada,
    });
  }
}
