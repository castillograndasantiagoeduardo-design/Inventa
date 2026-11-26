import { DomainError, Result } from '@inventa/shared-kernel';
import type { ReporteInventarioDto } from '@inventa/contracts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import {
  SucursalFueraDeAlcanceError,
  SucursalRequeridaError,
} from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import type { IReportesAdminRepository } from '../../domain/repositories/IReportesAdminRepository.ts';

export interface GenerarReporteInventarioRequest {
  usuarioId: string;
  sucursalId?: number;
  soloBajoMinimo?: boolean;
  page?: number;
  limit?: number;
}

export type GenerarReporteInventarioResponse = Result<ReporteInventarioDto, DomainError>;

export class GenerarReporteInventarioUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly reportesRepository: IReportesAdminRepository,
  ) {}

  public async execute(request: GenerarReporteInventarioRequest): Promise<GenerarReporteInventarioResponse> {
    const alcance = await this.resolverAlcance.execute({ usuarioId: request.usuarioId });
    if (alcance.isFailure) return Result.fail(alcance.error);

    let sucursalId = request.sucursalId;

    if (sucursalId !== undefined) {
      if (!alcance.value.permite(sucursalId)) {
        return Result.fail(new SucursalFueraDeAlcanceError());
      }
    } else if (!alcance.value.esGlobal) {
      const permitidas = alcance.value.sucursalesPermitidas();
      if (!permitidas || permitidas.length === 0) {
        return Result.fail(new SucursalRequeridaError());
      }
      if (permitidas.length > 1) {
        return Result.fail(new SucursalRequeridaError());
      }
      sucursalId = permitidas[0];
    } else {
      return Result.fail(new SucursalRequeridaError());
    }

    const reporte = await this.reportesRepository.obtenerReporteInventario({
      sucursalId,
      soloBajoMinimo: request.soloBajoMinimo,
      page: request.page ?? 1,
      limit: request.limit ?? 10,
    });

    return Result.ok(reporte);
  }
}
