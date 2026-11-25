import { DomainError, Result } from '@inventa/shared-kernel';
import type { EmpresaB2BDetalleDto } from '@inventa/contracts';
import type { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import type { ICarteraRepository } from '../../domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { CalculadorRentabilidadCliente } from '../../domain/services/CalculadorRentabilidadCliente.ts';
import {
  ClienteNoEncontradoError,
  ClienteRequeridoParaVentaB2BError,
} from '../../domain/errors/FacturacionErrors.ts';

export interface ObtenerEmpresaB2BDetalleRequest {
  clienteId: string;
  usuarioId: string;
  sucursalId?: number;
  fechaReferencia?: Date;
}

/**
 * Caso de uso para obtener el detalle completo de una empresa B2B:
 * estado de cupo, rentabilidad comercial frente al crédito, obligaciones de cartera,
 * historial reciente de abonos y avisos de pago reportados.
 */
export class ObtenerEmpresaB2BDetalleUseCase {
  constructor(
    private readonly clienteRepository: IClienteRepository,
    private readonly carteraRepository: ICarteraRepository,
    private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
  ) {}

  public async execute(
    request: ObtenerEmpresaB2BDetalleRequest,
  ): Promise<Result<EmpresaB2BDetalleDto, DomainError>> {
    const cliente = await this.clienteRepository.findById(request.clienteId);
    if (!cliente) {
      return Result.fail(new ClienteNoEncontradoError());
    }
    if (!cliente.esB2B) {
      return Result.fail(
        new ClienteRequeridoParaVentaB2BError('El detalle de cartera solo aplica a clientes corporativos (B2B).'),
      );
    }

    const sucursalId =
      request.sucursalId ??
      (await this.sucursalOperadorRepository.obtenerSucursalId(request.usuarioId)) ??
      undefined;

    const hoy = request.fechaReferencia ?? new Date();

    const [creditos, abonosRecientes, avisosResult, rentabilidadMap] = await Promise.all([
      this.carteraRepository.listarCreditosPorCliente(cliente.id, sucursalId),
      this.carteraRepository.listarAbonosPorCliente(cliente.id, 30),
      this.carteraRepository.listarAvisosPago({
        clienteId: cliente.id,
        sucursalId,
        pagina: 1,
        limite: 50,
      }),
      this.carteraRepository.obtenerRentabilidadPorClientes([cliente.id], sucursalId),
    ]);

    const rent = CalculadorRentabilidadCliente.calcular(
      rentabilidadMap[cliente.id],
      cliente.cupoCreditoAprobado,
    );

    let creditosVigentesCount = 0;
    let creditosPagadosCount = 0;
    let creditosEnMoraCount = 0;
    let montoVencido = 0;
    let diasMoraMax = 0;
    let antiguedadCarteraDias: number | null = null;

    for (const cred of creditos) {
      const estado = cred.estadoDerivado(hoy);
      if (estado === 'pagado') {
        creditosPagadosCount++;
      } else {
        creditosVigentesCount++;
        if (estado === 'en_mora') {
          creditosEnMoraCount++;
          montoVencido += cred.saldo;
          diasMoraMax = Math.max(diasMoraMax, cred.diasMora(hoy));
        }
      }
      const dias = cred.diasTranscurridos(hoy);
      antiguedadCarteraDias =
        antiguedadCarteraDias === null ? dias : Math.max(antiguedadCarteraDias, dias);
    }

    const avisosPendientesCount = avisosResult.items.filter((a) => a.estado === 'pendiente').length;

    return Result.ok({
      id: cliente.id,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      nombreRazonSocial: cliente.nombreRazonSocial,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      creditoHabilitado: cliente.creditoHabilitado,
      estadoCredito: cliente.estadoCredito,
      nivelRiesgoCredito: cliente.nivelRiesgoCredito,
      plazoCreditoDias: cliente.plazoCreditoDias,
      cupoCreditoSugerido: cliente.cupoCreditoSugerido,
      cupoCreditoAprobado: cliente.cupoCreditoAprobado,
      cupoCreditoUtilizado: cliente.cupoCreditoUtilizado,
      cupoCreditoDisponible: cliente.cupoCreditoDisponible,
      saldoPendiente:
        creditos.length > 0
          ? Math.round(creditos.reduce((s, c) => s + c.saldo, 0) * 100) / 100
          : cliente.saldoPendiente,
      gananciaNetaMensual: cliente.gananciaNetaMensual,
      antiguedadEmpresaMeses: cliente.antiguedadEmpresaMeses,
      observacionFinanciera: cliente.observacionFinanciera,
      motivoDecisionCredito: cliente.motivoDecisionCredito,
      totalFacturado: rent.totalFacturado,
      totalDevoluciones: rent.totalDevoluciones,
      gananciaGenerada: rent.gananciaGenerada,
      rentabilidadSobreCredito: rent.rentabilidadSobreCredito,
      creditosVigentesCount,
      creditosPagadosCount,
      creditosEnMoraCount,
      montoVencido: Math.round(montoVencido * 100) / 100,
      diasMoraMax,
      antiguedadCarteraDias,
      avisosPendientesCount,
      creditos: creditos.map((c) => c.toDTO(hoy)),
      abonosRecientes,
      avisosPago: avisosResult.items,
    });
  }
}
