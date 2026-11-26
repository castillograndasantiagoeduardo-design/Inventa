import { DomainError, Result } from '@inventa/shared-kernel';
import { GenerarReporteVentasUseCase } from './GenerarReporteVentasUseCase.ts';
import { GenerarReporteProductosUseCase } from './GenerarReporteProductosUseCase.ts';
import { GenerarReporteInventarioUseCase } from './GenerarReporteInventarioUseCase.ts';

export interface ExportarReporteCsvRequest {
  usuarioId: string;
  tipo: 'ventas' | 'productos' | 'inventario';
  desde?: string;
  hasta?: string;
  sucursalId?: number;
  orden?: 'ingresos' | 'unidades';
  categoriaId?: number;
}

export interface CsvResultado {
  contenido: string;
  nombreArchivo: string;
}

export type ExportarReporteCsvResponse = Result<CsvResultado, DomainError>;

export class ExportarReporteCsvUseCase {
  constructor(
    private readonly reporteVentasUseCase: GenerarReporteVentasUseCase,
    private readonly reporteProductosUseCase: GenerarReporteProductosUseCase,
    private readonly reporteInventarioUseCase: GenerarReporteInventarioUseCase,
  ) {}

  public async execute(request: ExportarReporteCsvRequest): Promise<ExportarReporteCsvResponse> {
    const BOM = '\uFEFF';
    const ahora = new Date().toISOString().slice(0, 10);

    if (request.tipo === 'ventas') {
      if (!request.desde || !request.hasta) {
        throw new Error('Las fechas "desde" y "hasta" son obligatorias para el reporte de ventas');
      }

      const res = await this.reporteVentasUseCase.execute({
        usuarioId: request.usuarioId,
        desde: request.desde,
        hasta: request.hasta,
        sucursalId: request.sucursalId,
      });
      if (res.isFailure) return Result.fail(res.error);

      const data = res.value;
      const lines: string[] = [];

      lines.push('REPORTE DE VENTAS - SUCURSAL #' + data.sucursalId);
      lines.push(`Rango: ${data.rango.desde} a ${data.rango.hasta} (${data.rango.dias} días)`);
      lines.push('');
      lines.push('RESUMEN GENERAL');
      lines.push('Métrica,Valor');
      lines.push(`Total Vendido,${data.resumen.totalVendido}`);
      lines.push(`Total Facturas,${data.resumen.totalFacturas}`);
      lines.push(`Ticket Promedio,${data.resumen.ticketPromedio}`);
      lines.push(`Monto Anuladas,${data.resumen.montoAnuladas}`);
      lines.push(`Cantidad Anuladas,${data.resumen.totalAnuladas}`);
      lines.push(`Monto Devoluciones,${data.resumen.montoDevoluciones}`);
      lines.push(`Cantidad Devoluciones,${data.resumen.totalDevoluciones}`);
      lines.push('');

      lines.push('DESGLOSE POR MÉTODO DE PAGO');
      lines.push('Método de Pago,Monto,Transacciones,Porcentaje');
      for (const m of data.desgloseMetodosPago) {
        lines.push(`"${m.medioPago}",${m.monto},${m.cantidadTransacciones},${m.porcentaje}%`);
      }
      lines.push('');

      lines.push('SERIE TEMPORAL (' + data.granularidad.toUpperCase() + ')');
      lines.push('Período,Etiqueta,Total Ventas,Cantidad Facturas');
      for (const s of data.serieTemporal) {
        lines.push(`"${s.periodo}","${s.label}",${s.totalVentas},${s.cantidadFacturas}`);
      }

      return Result.ok({
        contenido: BOM + lines.join('\r\n'),
        nombreArchivo: `reporte_ventas_sucursal_${data.sucursalId}_${request.desde}_${request.hasta}.csv`,
      });
    }

    if (request.tipo === 'productos') {
      if (!request.desde || !request.hasta) {
        throw new Error('Las fechas "desde" y "hasta" son obligatorias para el reporte de productos');
      }

      const res = await this.reporteProductosUseCase.execute({
        usuarioId: request.usuarioId,
        desde: request.desde,
        hasta: request.hasta,
        sucursalId: request.sucursalId,
        orden: request.orden ?? 'ingresos',
        limite: 50,
        categoriaId: request.categoriaId,
      });
      if (res.isFailure) return Result.fail(res.error);

      const data = res.value;
      const lines: string[] = [];

      lines.push('REPORTE DE PRODUCTOS - SUCURSAL #' + data.sucursalId);
      lines.push(`Rango: ${data.rango.desde} a ${data.rango.hasta}`);
      lines.push(`Criterio de orden: Por ${data.criterioOrden}`);
      lines.push('');
      lines.push('RANKING DE PRODUCTOS');
      lines.push('Posición,SKU,Producto,Categoría,Unidades Vendidas,Ingresos Totales');
      for (const p of data.ranking) {
        const cat = p.categoriaNombre ? `"${p.categoriaNombre.replace(/"/g, '""')}"` : '"Sin categoría"';
        const nom = `"${p.nombre.replace(/"/g, '""')}"`;
        lines.push(`${p.posicion},"${p.sku}",${nom},${cat},${p.unidadesVendidas},${p.ingresosTotales}`);
      }
      lines.push('');

      if (data.sinVentas.length > 0) {
        lines.push('PRODUCTOS ACTIVOS SIN VENTAS EN EL PERÍODO');
        lines.push('SKU,Producto,Categoría,Stock Actual en Sede');
        for (const sv of data.sinVentas) {
          const cat = sv.categoriaNombre ? `"${sv.categoriaNombre.replace(/"/g, '""')}"` : '"Sin categoría"';
          const nom = `"${sv.nombre.replace(/"/g, '""')}"`;
          lines.push(`"${sv.sku}",${nom},${cat},${sv.stockActual}`);
        }
      }

      return Result.ok({
        contenido: BOM + lines.join('\r\n'),
        nombreArchivo: `reporte_productos_sucursal_${data.sucursalId}_${request.desde}_${request.hasta}.csv`,
      });
    }

    if (request.tipo === 'inventario') {
      const res = await this.reporteInventarioUseCase.execute({
        usuarioId: request.usuarioId,
        sucursalId: request.sucursalId,
        soloBajoMinimo: false,
        page: 1,
        limit: 100,
      });
      if (res.isFailure) return Result.fail(res.error);

      const data = res.value;
      const lines: string[] = [];

      lines.push('REPORTE DE INVENTARIO - SUCURSAL #' + data.sucursalId);
      lines.push(`Fecha de corte: ${ahora}`);
      lines.push('');
      lines.push('SALUD DEL STOCK');
      lines.push('Total Productos,Óptimo,Stock Bajo,Agotado,Disponibilidad Saludable (%),Valor Total Inventario');
      lines.push(
        `${data.saludStock.totalProductos},${data.saludStock.optimo},${data.saludStock.bajo},${data.saludStock.agotado},${data.saludStock.porcentajeSaludable}%,${data.valorTotalInventario}`
      );
      lines.push('');

      lines.push('PRODUCTOS CRÍTICOS (BAJO EL MÍNIMO O AGOTADOS)');
      lines.push('SKU,Producto,Categoría,Stock Actual,Stock Mínimo,Estado');
      for (const item of data.productosBajoMinimo.items) {
        const cat = item.categoriaNombre ? `"${item.categoriaNombre.replace(/"/g, '""')}"` : '"Sin categoría"';
        const nom = `"${item.nombre.replace(/"/g, '""')}"`;
        lines.push(`"${item.sku}",${nom},${cat},${item.stockActual},${item.stockMinimo},"${item.estadoStock}"`);
      }

      return Result.ok({
        contenido: BOM + lines.join('\r\n'),
        nombreArchivo: `reporte_inventario_sucursal_${data.sucursalId}_${ahora}.csv`,
      });
    }

    throw new Error('Tipo de reporte no soportado');
  }
}
