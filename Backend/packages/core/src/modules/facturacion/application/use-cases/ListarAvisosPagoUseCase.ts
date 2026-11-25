import { DomainError, Result } from '@inventa/shared-kernel';
import type { AvisoPagoCreditoDto, FiltrosAvisosPago } from '@inventa/contracts';
import type { ICarteraRepository } from '../../domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../domain/repositories/ISucursalOperadorRepository.ts';

export interface ListarAvisosPagoRequest {
  filtros: FiltrosAvisosPago;
  usuarioId: string;
  sucursalId?: number;
}

export interface ListarAvisosPagoResultado {
  items: AvisoPagoCreditoDto[];
  total: number;
  pagina: number;
  limite: number;
}

/**
 * Caso de uso para listar los avisos de pago de cartera B2B en la sucursal
 * (bandeja de revisión para Admin de Sucursal / Super Admin y consulta de avisos).
 */
export class ListarAvisosPagoUseCase {
  constructor(
    private readonly carteraRepository: ICarteraRepository,
    private readonly sucursalOperadorRepository: ISucursalOperadorRepository,
  ) {}

  public async execute(
    request: ListarAvisosPagoRequest,
  ): Promise<Result<ListarAvisosPagoResultado, DomainError>> {
    const sucursalId =
      request.sucursalId ??
      (await this.sucursalOperadorRepository.obtenerSucursalId(request.usuarioId)) ??
      undefined;

    const pagina = request.filtros.pagina ?? 1;
    const limite = request.filtros.limite ?? 20;

    const { items, total } = await this.carteraRepository.listarAvisosPago({
      ...request.filtros,
      pagina,
      limite,
      sucursalId,
    });

    return Result.ok({
      items,
      total,
      pagina,
      limite,
    });
  }
}
