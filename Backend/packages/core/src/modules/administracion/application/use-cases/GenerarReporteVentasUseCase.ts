import { DomainError, Result } from '@inventa/shared-kernel';
import type { ReporteVentasDto } from '@inventa/contracts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import {
  SucursalFueraDeAlcanceError,
  SucursalRequeridaError,
} from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { FechaBogotaUtils } from '../../domain/services/FechaBogotaUtils.ts';
import type { IReportesAdminRepository } from '../../domain/repositories/IReportesAdminRepository.ts';

export interface GenerarReporteVentasRequest {
  usuarioId: string;
  desde: string;
  hasta: string;
  sucursalId?: number;
}

export type GenerarReporteVentasResponse = Result<ReporteVentasDto, DomainError>;

export class GenerarReporteVentasUseCase {
  constructor(
    private readonly resolverAlcance: ResolverAlcanceSucursalUseCase,
    private readonly reportesRepository: IReportesAdminRepository,
  ) {}

  public async execute(request: GenerarReporteVentasRequest): Promise<GenerarReporteVentasResponse> {
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
      // Super Admin debe especificar la sucursal de la cual desea el reporte
      return Result.fail(new SucursalRequeridaError());
    }

    const reporte = await this.reportesRepository.obtenerReporteVentas({
      sucursalId,
      desde: rango.desde,
      hasta: rango.hasta,
      desdeAnterior: rango.periodoAnterior.desde,
      hastaAnterior: rango.periodoAnterior.hasta,
      granularidad: rango.granularidad,
      desdeStr: rango.desdeStr,
      hastaStr: rango.hastaStr,
      desdeAnteriorStr: rango.periodoAnterior.desdeStr,
      hastaAnteriorStr: rango.periodoAnterior.hastaStr,
      dias: rango.dias,
    });

    return Result.ok(reporte);
  }
}
