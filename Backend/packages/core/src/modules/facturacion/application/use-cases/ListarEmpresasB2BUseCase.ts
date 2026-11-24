import { DomainError, Result } from '@inventa/shared-kernel';
import type {
  EmpresaB2BResumenDto,
  FiltrosEmpresasB2B,
  ResumenCarteraDto,
} from '@inventa/contracts';
import type { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import type { ICarteraRepository } from '../../domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';
import { CalculadorRentabilidadCliente } from '../../domain/services/CalculadorRentabilidadCliente.ts';
import type { CreditoB2B } from '../../domain/entities/CreditoB2B.ts';

export interface ListarEmpresasB2BRequest {
  filtros: FiltrosEmpresasB2B;
  usuarioId: string;
  sucursalId?: number;
  fechaReferencia?: Date;
}

export interface ListarEmpresasB2BResultado {
  empresas: EmpresaB2BResumenDto[];
  resumen: ResumenCarteraDto;
}

/**
 * Caso de uso para listar las empresas B2B visibles para la sucursal del usuario,
 * consolidando su estado crediticio, rentabilidad comercial frente al cupo otorgado,
 * antigüedad de cartera, obligaciones vigentes/pagadas y mora derivada.
 */
export class ListarEmpresasB2BUseCase {
  constructor(
    private readonly clienteRepository: IClienteRepository,
    private readonly carteraRepository: ICarteraRepository,
    private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
  ) {}

  public async execute(
    request: ListarEmpresasB2BRequest,
  ): Promise<Result<ListarEmpresasB2BResultado, DomainError>> {
    const sucursalId =
      request.sucursalId ??
      (await this.sucursalOperadorRepository.obtenerSucursalId(request.usuarioId)) ??
      undefined;

    const hoy = request.fechaReferencia ?? new Date();

    const clientesB2B = this.clienteRepository.buscarPaginado
      ? (
          await this.clienteRepository.buscarPaginado({
            texto: request.filtros.buscar,
            tipoCliente: 'B2B',
            page: 1,
            limite: 500,
            offset: 0,
          })
        ).items
      : (
          await this.clienteRepository.buscar({
            texto: request.filtros.buscar,
            limite: 500,
          })
        ).filter((c) => c.esB2B);

    const filtradosEstado = request.filtros.estadoCredito
      ? clientesB2B.filter((c) => c.estadoCredito === request.filtros.estadoCredito)
      : clientesB2B;

    const clienteIds = filtradosEstado.map((c) => c.id);

    const [rentabilidadMap, avisosMap, carteraResult] = await Promise.all([
      this.carteraRepository.obtenerRentabilidadPorClientes(clienteIds, sucursalId),
      this.carteraRepository.contarAvisosPendientesPorClientes(clienteIds, sucursalId),
      this.carteraRepository.listarCreditos({
        sucursalId,
        pagina: 1,
        limite: 1000,
      }),
    ]);

    const creditosPorCliente = new Map<string, CreditoB2B[]>();
    for (const credito of carteraResult.items) {
      const lista = creditosPorCliente.get(credito.clienteId) ?? [];
      lista.push(credito);
      creditosPorCliente.set(credito.clienteId, lista);
    }

    const empresasBase: EmpresaB2BResumenDto[] = filtradosEstado.map((cliente) => {
      const rent = CalculadorRentabilidadCliente.calcular(
        rentabilidadMap[cliente.id],
        cliente.cupoCreditoAprobado,
      );
      const creditos = creditosPorCliente.get(cliente.id) ?? [];

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

      return {
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
        saldoPendiente: cliente.saldoPendiente,
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
        avisosPendientesCount: avisosMap[cliente.id] ?? 0,
      };
    });

    const empresas = empresasBase.filter((e) => {
      if (request.filtros.soloEnMora && e.creditosEnMoraCount === 0) return false;
      if (
        request.filtros.conCartera &&
        e.creditosVigentesCount === 0 &&
        e.creditosPagadosCount === 0
      ) {
        return false;
      }
      return true;
    });

    const resumen: ResumenCarteraDto = {
      totalEmpresasB2B: empresas.length,
      empresasConCredito: empresas.filter((e) => e.creditoHabilitado).length,
      cupoTotalAprobado: redondear(empresas.reduce((s, e) => s + e.cupoCreditoAprobado, 0)),
      cupoTotalUtilizado: redondear(empresas.reduce((s, e) => s + e.cupoCreditoUtilizado, 0)),
      cupoTotalDisponible: redondear(empresas.reduce((s, e) => s + e.cupoCreditoDisponible, 0)),
      saldoTotalPendiente: redondear(empresas.reduce((s, e) => s + e.saldoPendiente, 0)),
      montoTotalVencido: redondear(empresas.reduce((s, e) => s + e.montoVencido, 0)),
      empresasEnMora: empresas.filter((e) => e.creditosEnMoraCount > 0).length,
      creditosVigentesCount: empresas.reduce((s, e) => s + e.creditosVigentesCount, 0),
      creditosPagadosCount: empresas.reduce((s, e) => s + e.creditosPagadosCount, 0),
      gananciaTotalGenerada: redondear(empresas.reduce((s, e) => s + e.gananciaGenerada, 0)),
      avisosPendientesCount: empresas.reduce((s, e) => s + e.avisosPendientesCount, 0),
    };

    return Result.ok({ empresas, resumen });
  }
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}
