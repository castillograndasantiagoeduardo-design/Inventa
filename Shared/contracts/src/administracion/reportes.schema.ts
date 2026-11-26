import { z } from 'zod';

/**
 * reportes.schema.ts — Contratos de validación y DTOs para el módulo de Reportes de Admin de Sucursal (Fase 6).
 */

const fechaYyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}/;

export const reporteVentasQuerySchema = z.object({
  desde: z
    .string({ required_error: 'La fecha inicial (desde) es obligatoria' })
    .regex(fechaYyyyMmDdRegex, 'La fecha inicial debe tener formato YYYY-MM-DD'),
  hasta: z
    .string({ required_error: 'La fecha final (hasta) es obligatoria' })
    .regex(fechaYyyyMmDdRegex, 'La fecha final debe tener formato YYYY-MM-DD'),
  sucursalId: z.coerce.number().int().positive().optional(),
});
export type ReporteVentasQuery = z.infer<typeof reporteVentasQuerySchema>;

export const reporteProductosQuerySchema = z.object({
  desde: z
    .string({ required_error: 'La fecha inicial (desde) es obligatoria' })
    .regex(fechaYyyyMmDdRegex, 'La fecha inicial debe tener formato YYYY-MM-DD'),
  hasta: z
    .string({ required_error: 'La fecha final (hasta) es obligatoria' })
    .regex(fechaYyyyMmDdRegex, 'La fecha final debe tener formato YYYY-MM-DD'),
  sucursalId: z.coerce.number().int().positive().optional(),
  orden: z.enum(['ingresos', 'unidades']).default('ingresos'),
  limite: z.coerce.number().int().min(1).max(50).default(10),
  categoriaId: z.coerce.number().int().positive().optional(),
});
export type ReporteProductosQuery = z.infer<typeof reporteProductosQuerySchema>;

export const reporteInventarioQuerySchema = z.object({
  sucursalId: z.coerce.number().int().positive().optional(),
  soloBajoMinimo: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .optional()
    .transform((val) => val === true || val === 'true' || val === '1'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type ReporteInventarioQuery = z.infer<typeof reporteInventarioQuerySchema>;

export const exportarReporteQuerySchema = z.object({
  tipo: z.enum(['ventas', 'productos', 'inventario']),
  desde: z.string().regex(fechaYyyyMmDdRegex).optional(),
  hasta: z.string().regex(fechaYyyyMmDdRegex).optional(),
  sucursalId: z.coerce.number().int().positive().optional(),
  orden: z.enum(['ingresos', 'unidades']).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
});
export type ExportarReporteQuery = z.infer<typeof exportarReporteQuerySchema>;

// ─── DTOs de Respuesta ────────────────────────────────────────────────────────

export interface DesgloseMetodoPagoDto {
  medioPago: string;
  monto: number;
  cantidadTransacciones: number;
  porcentaje: number;
}

export interface PuntoSerieTemporalDto {
  periodo: string; // "08:00", "2026-11-19", "2026-W45"
  label: string; // "8:00 AM", "19 Nov", "Semana 45"
  totalVentas: number;
  cantidadFacturas: number;
}

export interface ComparativaPeriodoAnteriorDto {
  totalVendidoAnterior: number;
  totalFacturasAnterior: number;
  ticketPromedioAnterior: number;
  variacionTotalVendido: number;
  variacionPorcentualTotalVendido: number | null;
  variacionFacturas: number;
  variacionPorcentualFacturas: number | null;
  desdeAnterior: string;
  hastaAnterior: string;
}

export interface ResumenVentasDto {
  totalVendido: number;
  totalFacturas: number;
  ticketPromedio: number;
  montoAnuladas: number;
  totalAnuladas: number;
  montoDevoluciones: number;
  totalDevoluciones: number;
}

export interface ReporteVentasDto {
  sucursalId: number;
  rango: {
    desde: string;
    hasta: string;
    dias: number;
  };
  granularidad: 'hora' | 'dia' | 'semana';
  resumen: ResumenVentasDto;
  desgloseMetodosPago: DesgloseMetodoPagoDto[];
  serieTemporal: PuntoSerieTemporalDto[];
  comparativaPeriodoAnterior: ComparativaPeriodoAnteriorDto;
}

export interface ItemRankingProductoDto {
  posicion: number;
  productoId: string;
  sku: string;
  nombre: string;
  categoriaNombre?: string;
  unidadesVendidas: number;
  ingresosTotales: number;
}

export interface ItemProductoSinVentasDto {
  productoId: string;
  sku: string;
  nombre: string;
  categoriaNombre?: string;
  stockActual: number;
}

export interface ReporteProductosDto {
  sucursalId: number;
  rango: {
    desde: string;
    hasta: string;
  };
  criterioOrden: 'ingresos' | 'unidades';
  ranking: ItemRankingProductoDto[];
  sinVentas: ItemProductoSinVentasDto[];
  totalProductosVendidos: number;
}

export interface SaludStockDto {
  optimo: number;
  bajo: number;
  agotado: number;
  totalProductos: number;
  porcentajeSaludable: number;
}

export interface ItemProductoBajoMinimoDto {
  productoId: string;
  sku: string;
  nombre: string;
  categoriaNombre?: string;
  stockActual: number;
  stockMinimo: number;
  estadoStock: 'bajo' | 'agotado';
}

export interface ReporteInventarioDto {
  sucursalId: number;
  saludStock: SaludStockDto;
  productosBajoMinimo: {
    items: ItemProductoBajoMinimoDto[];
    total: number;
    page: number;
    limit: number;
    totalPaginas: number;
  };
  valorTotalInventario: number;
}
