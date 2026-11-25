import { DomainError, Result } from '@inventa/shared-kernel';
import type { EmpresaEnMoraDto } from '@inventa/contracts';
import type { IClienteRepository } from '../../domain/repositories/IClienteRepository.ts';
import type { ICarteraRepository } from '../../domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';

export interface ListarEmpresasEnMoraRequest {
  usuarioId: string;
  sucursalId?: number;
  fechaReferencia?: Date;
}

/**
 * Caso de uso para listar las empresas B2B que presentan obligaciones vencidas
 * (saldo > 0 y fecha_vencimiento < fecha actual), ordenadas por mayor mora.
 */
export class ListarEmpresasEnMoraUseCase {
  constructor(
    private readonly clienteRepository: IClienteRepository,
    private readonly carteraRepository: ICarteraRepository,
    private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
  ) {}

  public async execute(
    request: ListarEmpresasEnMoraRequest,
  ): Promise<Result<EmpresaEnMoraDto[], DomainError>> {
    const sucursalId =
      request.sucursalId ??
      (await this.sucursalOperadorRepository.obtenerSucursalId(request.usuarioId)) ??
      undefined;

    const hoy = request.fechaReferencia ?? new Date();

    const { items } = await this.carteraRepository.listarCreditos({
      sucursalId,
      pagina: 1,
      limite: 1000,
    });

    const vencidos = items.filter((c) => c.estaEnMora(hoy));
    if (vencidos.length === 0) {
      return Result.ok([]);
    }

    const porCliente = new Map<
      string,
      {
        clienteNombre: string;
        montoVencido: number;
        diasMoraMax: number;
        creditosVencidosCount: number;
        masAntiguo: Date;
      }
    >();

    for (const c of vencidos) {
      const dias = c.diasMora(hoy);
      const actual = porCliente.get(c.clienteId);
      if (!actual) {
        porCliente.set(c.clienteId, {
          clienteNombre: c.clienteNombre,
          montoVencido: c.saldo,
          diasMoraMax: dias,
          creditosVencidosCount: 1,
          masAntiguo: c.fechaVencimiento,
        });
      } else {
        actual.montoVencido += c.saldo;
        actual.diasMoraMax = Math.max(actual.diasMoraMax, dias);
        actual.creditosVencidosCount++;
        if (c.fechaVencimiento.getTime() < actual.masAntiguo.getTime()) {
          actual.masAntiguo = c.fechaVencimiento;
        }
      }
    }

    const resultados: EmpresaEnMoraDto[] = [];
    for (const [clienteId, agg] of porCliente.entries()) {
      const cli = await this.clienteRepository.findById(clienteId);
      resultados.push({
        clienteId,
        nombreRazonSocial: cli?.nombreRazonSocial ?? agg.clienteNombre,
        tipoDocumento: cli?.tipoDocumento ?? 'NIT',
        numeroDocumento: cli?.numeroDocumento ?? '—',
        telefono: cli?.telefono ?? null,
        montoVencido: Math.round(agg.montoVencido * 100) / 100,
        diasMoraMax: agg.diasMoraMax,
        creditosVencidosCount: agg.creditosVencidosCount,
        creditoMasAntiguoVencido: agg.masAntiguo.toISOString(),
      });
    }

    resultados.sort((a, b) => b.diasMoraMax - a.diasMoraMax || b.montoVencido - a.montoVencido);

    return Result.ok(resultados);
  }
}
