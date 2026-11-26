/**
 * branch-reports.types.ts — Tipos y contratos para la interfaz del módulo de Reportes de Admin de Sucursal (Fase 6).
 */

export type {
  ReporteVentasDto,
  ReporteProductosDto,
  ReporteInventarioDto,
  ResumenVentasDto,
  DesgloseMetodoPagoDto,
  PuntoSerieTemporalDto,
  ComparativaPeriodoAnteriorDto,
  ItemRankingProductoDto,
  ItemProductoSinVentasDto,
  SaludStockDto,
  ItemProductoBajoMinimoDto,
  ReporteVentasQuery,
  ReporteProductosQuery,
  ReporteInventarioQuery,
  ExportarReporteQuery,
} from '@inventa/contracts';

export type CriterioOrdenProductos = 'ingresos' | 'unidades';
