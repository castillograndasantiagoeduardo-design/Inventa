import { DomainError, Result } from '@inventa/shared-kernel';
import type { CreditoB2BDto, FiltrosCarteraB2B } from '@inventa/contracts';
import type { ICarteraRepository } from '../../domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';

export interface ListarCarteraRequest {
  filtros: FiltrosCarteraB2B;
  usuarioId: string;
  sucursalId?: number;
  fechaReferencia?: Date;
}

export interface ListarCarteraResultado {
  items: CreditoB2BDto[];
  total: number;
  pagina: number;
  limite: number;
  resumen: {
    vigentes: number;
    pagados: number;
    enMora: number;
    saldoTotal: number;
  };
}

/**
 * Caso de uso para listar las obligaciones de cartera B2B (créditos vigentes,
 * pagados y en mora) con su antigüedad en días ("tiempo pagando") y filtro por estado derivado.
 */
export class ListarCarteraUseCase {
  constructor(
    private readonly carteraRepository: ICarteraRepository,
    private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
  ) {}

  public async execute(
    request: ListarCarteraRequest,
  ): Promise<Result<ListarCarteraResultado, DomainError>> {
    const sucursalId =
      request.sucursalId ??
      (await this.sucursalOperadorRepository.obtenerSucursalId(request.usuarioId)) ??
      undefined;

    const hoy = request.fechaReferencia ?? new Date();
    const { pagina = 1, limite = 20 } = request.filtros;

    // Si se filtra por estado derivado (`vigente`, `en_mora` o `pagado`), consultamos
    // sin límite estrecho para aplicar la derivación de mora por fecha de referencia.
    const { items: todos } = await this.carteraRepository.listarCreditos({
      clienteId: request.filtros.clienteId,
      sucursalId,
      pagina: 1,
      limite: 1000,
    });

    let vigentes = 0;
    let pagados = 0;
    let enMora = 0;
    let saldoTotal = 0;

    const dtosTodos = todos.map((c) => {
      const dto = c.toDTO(hoy);
      if (dto.estado === 'pagado') pagados++;
      else {
        vigentes++;
        saldoTotal += dto.saldo;
        if (dto.estado === 'en_mora') enMora++;
      }
      return dto;
    });

    const filtrados = request.filtros.estado
      ? dtosTodos.filter((d) => d.estado === request.filtros.estado)
      : dtosTodos;

    const inicio = (pagina - 1) * limite;
    const paginados = filtrados.slice(inicio, inicio + limite);

    return Result.ok({
      items: paginados,
      total: filtrados.length,
      pagina,
      limite,
      resumen: {
        vigentes,
        pagados,
        enMora,
        saldoTotal: Math.round(saldoTotal * 100) / 100,
      },
    });
  }
}
