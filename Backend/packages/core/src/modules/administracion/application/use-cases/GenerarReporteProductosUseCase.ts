import { DomainError, Result } from '@inventa/shared-kernel';
import type { ReporteProductosDto } from '@inventa/contracts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import {
  SucursalFueraDeAlcanceError,
  SucursalRequeridaError,
} from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { FechaBogotaUtils } from '../../domain/services/FechaBogotaUtils.ts';
import type { IReportesAdminRepository } from '../../domain/repositories/IReportesAdminRepository.ts';

export interface GenerarReporteProductosRequest {
  usuarioId: string;
  desde: string;
  hasta: string;
  sucursalId?: number;
  orden?: 'ingresos' | 'unidades';
  limite?: number;
  categoriaId?: number;
}

export type GenerarReporteProductosResponse = Result<ReporteProductosDto, DomainError>;

export class GenerarReporteProductosUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly reportesRepository: IReportesAdminRepository,
  ) {}

  public async execute(request: GenerarReporteProductosRequest): Promise<GenerarReporteProductosResponse> {
    let rango;
    try {
      rango = FechaBogotaUtils.procesarRango(request.desde, request.hasta);
    } catch (err) {
      if (err instanceof DomainError) return Result.fail(err);
      throw err;
    }

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

    const reporte = await this.reportesRepository.obtenerReporteProductos({
      sucursalId,
      desde: rango.desde,
      hasta: rango.hasta,
      orden: request.orden ?? 'ingresos',
      limite: request.limite ?? 10,
      categoriaId: request.categoriaId,
      desdeStr: rango.desdeStr,
      hastaStr: rango.hastaStr,
    });

    return Result.ok(reporte);
  }
}
