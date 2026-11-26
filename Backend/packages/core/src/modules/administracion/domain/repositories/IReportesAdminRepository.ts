import type {
  ReporteVentasDto,
  ReporteProductosDto,
  ReporteInventarioDto,
} from '@inventa/contracts';

export interface ParametrosReporteVentas {
  sucursalId: number;
  desde: Date;
  hasta: Date;
  desdeAnterior: Date;
  hastaAnterior: Date;
  granularidad: 'hora' | 'dia' | 'semana';
  desdeStr: string;
  hastaStr: string;
  desdeAnteriorStr: string;
  hastaAnteriorStr: string;
  dias: number;
}

export interface ParametrosReporteProductos {
  sucursalId: number;
  desde: Date;
  hasta: Date;
  orden: 'ingresos' | 'unidades';
  limite: number;
  categoriaId?: number;
  desdeStr: string;
  hastaStr: string;
}

export interface ParametrosReporteInventario {
  sucursalId: number;
  soloBajoMinimo?: boolean;
  page: number;
  limit: number;
}

export interface IReportesAdminRepository {
  obtenerReporteVentas(params: ParametrosReporteVentas): Promise<ReporteVentasDto>;
  obtenerReporteProductos(params: ParametrosReporteProductos): Promise<ReporteProductosDto>;
  obtenerReporteInventario(params: ParametrosReporteInventario): Promise<ReporteInventarioDto>;
}
