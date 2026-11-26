import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  lte,
  notInArray,
  sql,
  type SQL,
} from 'drizzle-orm';
import { Database } from '../../client.ts';
import { facturas, factura_items, factura_pagos, devoluciones_ventas } from '../../schema/facturacion.schema.ts';
import { categorias, inventario_sucursal, productos } from '../../schema/inventario.schema.ts';
import type {
  IReportesAdminRepository,
  ParametrosReporteInventario,
  ParametrosReporteProductos,
  ParametrosReporteVentas,
} from '@inventa/core';
import { FechaBogotaUtils } from '@inventa/core';
import type {
  DesgloseMetodoPagoDto,
  ItemProductoBajoMinimoDto,
  ItemRankingProductoDto,
  PuntoSerieTemporalDto,
  ReporteInventarioDto,
  ReporteProductosDto,
  ReporteVentasDto,
} from '@inventa/contracts';

export class DrizzleReportesAdminRepository implements IReportesAdminRepository {
  constructor(private readonly db: Database) {}

  public async obtenerReporteVentas(params: ParametrosReporteVentas): Promise<ReporteVentasDto> {
    // 1. Facturas emitidas válidas del período
    const [facturasAgg] = await this.db
      .select({
        totalVendido: sql<string>`COALESCE(SUM(${facturas.total}), '0.00')`,
        totalFacturas: sql<number>`COUNT(${facturas.id_factura})`,
      })
      .from(facturas)
      .where(
        and(
          eq(facturas.sucursal_id, params.sucursalId),
          eq(facturas.estado, 'emitida'),
          isNull(facturas.deleted_at),
          gte(facturas.fecha, params.desde),
          lte(facturas.fecha, params.hasta),
        ),
      );

    // 2. Facturas anuladas
    const [anuladasAgg] = await this.db
      .select({
        montoAnuladas: sql<string>`COALESCE(SUM(${facturas.total}), '0.00')`,
        totalAnuladas: sql<number>`COUNT(${facturas.id_factura})`,
      })
      .from(facturas)
      .where(
        and(
          eq(facturas.sucursal_id, params.sucursalId),
          eq(facturas.estado, 'anulada'),
          isNull(facturas.deleted_at),
          gte(facturas.fecha, params.desde),
          lte(facturas.fecha, params.hasta),
        ),
      );

    // 3. Devoluciones de ventas
    const [devolucionesAgg] = await this.db
      .select({
        montoDevoluciones: sql<string>`COALESCE(SUM(${devoluciones_ventas.monto_reembolso}), '0.00')`,
        totalDevoluciones: sql<number>`COUNT(${devoluciones_ventas.id_devolucion_venta})`,
      })
      .from(devoluciones_ventas)
      .where(
        and(
          eq(devoluciones_ventas.sucursal_id, params.sucursalId),
          isNull(devoluciones_ventas.deleted_at),
          gte(devoluciones_ventas.fecha, params.desde),
          lte(devoluciones_ventas.fecha, params.hasta),
        ),
      );

    // 4. Desglose por método de pago
    const pagosRows = await this.db
      .select({
        medioPago: factura_pagos.medio_pago,
        monto: sql<string>`COALESCE(SUM(${factura_pagos.monto}), '0.00')`,
        cantidadTransacciones: sql<number>`COUNT(${factura_pagos.id_factura_pago})`,
      })
      .from(factura_pagos)
      .innerJoin(facturas, eq(factura_pagos.factura_id, facturas.id_factura))
      .where(
        and(
          eq(facturas.sucursal_id, params.sucursalId),
          eq(facturas.estado, 'emitida'),
          isNull(facturas.deleted_at),
          gte(facturas.fecha, params.desde),
          lte(facturas.fecha, params.hasta),
        ),
      )
      .groupBy(factura_pagos.medio_pago)
      .orderBy(desc(sql`SUM(${factura_pagos.monto})`));

    const totalVendido = Number(Number(facturasAgg?.totalVendido ?? 0).toFixed(2));
    const totalFacturas = Number(facturasAgg?.totalFacturas ?? 0);
    const ticketPromedio = totalFacturas > 0 ? Number((totalVendido / totalFacturas).toFixed(2)) : 0;

    const desgloseMetodosPago: DesgloseMetodoPagoDto[] = pagosRows.map((r) => {
      const monto = Number(Number(r.monto).toFixed(2));
      const porcentaje = totalVendido > 0 ? Number(((monto / totalVendido) * 100).toFixed(1)) : 0;
      return {
        medioPago: r.medioPago,
        monto,
        cantidadTransacciones: Number(r.cantidadTransacciones),
        porcentaje,
      };
    });

    // 5. Serie temporal con conversión a hora de Bogotá
    const formatoSql =
      params.granularidad === 'hora'
        ? sql`DATE_FORMAT(CONVERT_TZ(${facturas.fecha}, '+00:00', '-05:00'), '%H:00')`
        : params.granularidad === 'semana'
        ? sql`CONCAT(YEAR(CONVERT_TZ(${facturas.fecha}, '+00:00', '-05:00')), '-W', LPAD(WEEK(CONVERT_TZ(${facturas.fecha}, '+00:00', '-05:00'), 1), 2, '0'))`
        : sql`DATE_FORMAT(CONVERT_TZ(${facturas.fecha}, '+00:00', '-05:00'), '%Y-%m-%d')`;

    const serieRows = await this.db
      .select({
        periodo: sql<string>`${formatoSql}`,
        totalVentas: sql<string>`COALESCE(SUM(${facturas.total}), '0.00')`,
        cantidadFacturas: sql<number>`COUNT(${facturas.id_factura})`,
      })
      .from(facturas)
      .where(
        and(
          eq(facturas.sucursal_id, params.sucursalId),
          eq(facturas.estado, 'emitida'),
          isNull(facturas.deleted_at),
          gte(facturas.fecha, params.desde),
          lte(facturas.fecha, params.hasta),
        ),
      )
      .groupBy(sql`${formatoSql}`)
      .orderBy(asc(sql`${formatoSql}`));

    const serieTemporal: PuntoSerieTemporalDto[] = serieRows.map((r) => ({
      periodo: r.periodo,
      label: FechaBogotaUtils.formatearEtiquetaPeriodo(r.periodo, params.granularidad),
      totalVentas: Number(Number(r.totalVentas).toFixed(2)),
      cantidadFacturas: Number(r.cantidadFacturas),
    }));

    // 6. Comparativa con período anterior de igual duración
    const [anteriorAgg] = await this.db
      .select({
        totalVendido: sql<string>`COALESCE(SUM(${facturas.total}), '0.00')`,
        totalFacturas: sql<number>`COUNT(${facturas.id_factura})`,
      })
      .from(facturas)
      .where(
        and(
          eq(facturas.sucursal_id, params.sucursalId),
          eq(facturas.estado, 'emitida'),
          isNull(facturas.deleted_at),
          gte(facturas.fecha, params.desdeAnterior),
          lte(facturas.fecha, params.hastaAnterior),
        ),
      );

    const totalVendidoAnterior = Number(Number(anteriorAgg?.totalVendido ?? 0).toFixed(2));
    const totalFacturasAnterior = Number(anteriorAgg?.totalFacturas ?? 0);
    const ticketPromedioAnterior =
      totalFacturasAnterior > 0 ? Number((totalVendidoAnterior / totalFacturasAnterior).toFixed(2)) : 0;

    const variacionTotalVendido = Number((totalVendido - totalVendidoAnterior).toFixed(2));
    const variacionPorcentualTotalVendido =
      totalVendidoAnterior > 0
        ? Number((((totalVendido - totalVendidoAnterior) / totalVendidoAnterior) * 100).toFixed(1))
        : null;

    const variacionFacturas = totalFacturas - totalFacturasAnterior;
    const variacionPorcentualFacturas =
      totalFacturasAnterior > 0
        ? Number((((totalFacturas - totalFacturasAnterior) / totalFacturasAnterior) * 100).toFixed(1))
        : null;

    return {
      sucursalId: params.sucursalId,
      rango: {
        desde: params.desdeStr,
        hasta: params.hastaStr,
        dias: params.dias,
      },
      granularidad: params.granularidad,
      resumen: {
        totalVendido,
        totalFacturas,
        ticketPromedio,
        montoAnuladas: Number(Number(anuladasAgg?.montoAnuladas ?? 0).toFixed(2)),
        totalAnuladas: Number(anuladasAgg?.totalAnuladas ?? 0),
        montoDevoluciones: Number(Number(devolucionesAgg?.montoDevoluciones ?? 0).toFixed(2)),
        totalDevoluciones: Number(devolucionesAgg?.totalDevoluciones ?? 0),
      },
      desgloseMetodosPago,
      serieTemporal,
      comparativaPeriodoAnterior: {
        totalVendidoAnterior,
        totalFacturasAnterior,
        ticketPromedioAnterior,
        variacionTotalVendido,
        variacionPorcentualTotalVendido,
        variacionFacturas,
        variacionPorcentualFacturas,
        desdeAnterior: params.desdeAnteriorStr,
        hastaAnterior: params.hastaAnteriorStr,
      },
    };
  }

  public async obtenerReporteProductos(params: ParametrosReporteProductos): Promise<ReporteProductosDto> {
    // 1. Ranking de productos con ventas emitidas
    const condicionesRank: SQL[] = [
      eq(productos.is_active, 1),
      eq(facturas.sucursal_id, params.sucursalId),
      eq(facturas.estado, 'emitida'),
      isNull(facturas.deleted_at),
      isNull(factura_items.deleted_at),
      gte(facturas.fecha, params.desde),
      lte(facturas.fecha, params.hasta),
    ];
    if (params.categoriaId) {
      condicionesRank.push(eq(productos.categoria_id, params.categoriaId));
    }

    const orderSql =
      params.orden === 'unidades'
        ? desc(sql`SUM(${factura_items.cantidad})`)
        : desc(sql`SUM(${factura_items.subtotal})`);

    const rankingRows = await this.db
      .select({
        productoId: productos.id_producto,
        sku: productos.sku,
        nombre: productos.nombre,
        categoriaNombre: categorias.nombre,
        unidadesVendidas: sql<number>`COALESCE(SUM(${factura_items.cantidad}), 0)`,
        ingresosTotales: sql<string>`COALESCE(SUM(${factura_items.subtotal}), '0.00')`,
      })
      .from(factura_items)
      .innerJoin(facturas, eq(factura_items.factura_id, facturas.id_factura))
      .innerJoin(productos, eq(factura_items.producto_id, productos.id_producto))
      .leftJoin(categorias, eq(productos.categoria_id, categorias.id_categoria))
      .where(and(...condicionesRank))
      .groupBy(productos.id_producto, productos.sku, productos.nombre, categorias.nombre)
      .orderBy(orderSql)
      .limit(params.limite);

    const ranking: ItemRankingProductoDto[] = rankingRows.map((r, idx) => ({
      posicion: idx + 1,
      productoId: r.productoId,
      sku: r.sku,
      nombre: r.nombre,
      categoriaNombre: r.categoriaNombre ?? undefined,
      unidadesVendidas: Number(r.unidadesVendidas),
      ingresosTotales: Number(Number(r.ingresosTotales).toFixed(2)),
    }));

    // 2. Productos activos en inventario de la sede sin ventas en el rango
    const subqueryVendidos = this.db
      .selectDistinct({ productoId: factura_items.producto_id })
      .from(factura_items)
      .innerJoin(facturas, eq(factura_items.factura_id, facturas.id_factura))
      .where(
        and(
          eq(facturas.sucursal_id, params.sucursalId),
          eq(facturas.estado, 'emitida'),
          isNull(facturas.deleted_at),
          isNull(factura_items.deleted_at),
          gte(facturas.fecha, params.desde),
          lte(facturas.fecha, params.hasta),
        ),
      );

    const condicionesSinVentas: SQL[] = [
      eq(productos.is_active, 1),
      eq(inventario_sucursal.sucursal_id, params.sucursalId),
      notInArray(productos.id_producto, subqueryVendidos),
    ];
    if (params.categoriaId) {
      condicionesSinVentas.push(eq(productos.categoria_id, params.categoriaId));
    }

    const sinVentasRows = await this.db
      .select({
        productoId: productos.id_producto,
        sku: productos.sku,
        nombre: productos.nombre,
        categoriaNombre: categorias.nombre,
        stockActual: inventario_sucursal.stock_actual,
      })
      .from(productos)
      .innerJoin(
        inventario_sucursal,
        and(
          eq(productos.id_producto, inventario_sucursal.producto_id),
          eq(inventario_sucursal.sucursal_id, params.sucursalId),
        ),
      )
      .leftJoin(categorias, eq(productos.categoria_id, categorias.id_categoria))
      .where(and(...condicionesSinVentas))
      .orderBy(asc(productos.nombre))
      .limit(20);

    const sinVentas = sinVentasRows.map((sv) => ({
      productoId: sv.productoId,
      sku: sv.sku,
      nombre: sv.nombre,
      categoriaNombre: sv.categoriaNombre ?? undefined,
      stockActual: Number(sv.stockActual),
    }));

    return {
      sucursalId: params.sucursalId,
      rango: {
        desde: params.desdeStr,
        hasta: params.hastaStr,
      },
      criterioOrden: params.orden,
      ranking,
      sinVentas,
      totalProductosVendidos: ranking.length,
    };
  }

  public async obtenerReporteInventario(params: ParametrosReporteInventario): Promise<ReporteInventarioDto> {
    const condicionesInv: SQL[] = [
      eq(productos.is_active, 1),
      eq(inventario_sucursal.sucursal_id, params.sucursalId),
    ];

    // 1. Salud del stock y valorización total del inventario
    const [healthAgg] = await this.db
      .select({
        totalProductos: sql<number>`COUNT(${productos.id_producto})`,
        optimo: sql<number>`COALESCE(SUM(CASE WHEN ${inventario_sucursal.stock_actual} > ${inventario_sucursal.stock_minimo} THEN 1 ELSE 0 END), 0)`,
        bajo: sql<number>`COALESCE(SUM(CASE WHEN ${inventario_sucursal.stock_actual} > 0 AND ${inventario_sucursal.stock_actual} <= ${inventario_sucursal.stock_minimo} THEN 1 ELSE 0 END), 0)`,
        agotado: sql<number>`COALESCE(SUM(CASE WHEN ${inventario_sucursal.stock_actual} <= 0 THEN 1 ELSE 0 END), 0)`,
        valorTotalInventario: sql<string>`COALESCE(SUM(${inventario_sucursal.stock_actual} * ${productos.precio_compra}), '0.00')`,
      })
      .from(inventario_sucursal)
      .innerJoin(productos, eq(inventario_sucursal.producto_id, productos.id_producto))
      .where(and(...condicionesInv));

    const totalProductos = Number(healthAgg?.totalProductos ?? 0);
    const optimo = Number(healthAgg?.optimo ?? 0);
    const bajo = Number(healthAgg?.bajo ?? 0);
    const agotado = Number(healthAgg?.agotado ?? 0);
    const valorTotalInventario = Number(Number(healthAgg?.valorTotalInventario ?? 0).toFixed(2));
    const porcentajeSaludable =
      totalProductos > 0 ? Number(((optimo / totalProductos) * 100).toFixed(1)) : 100;

    // 2. Lista de productos bajo el mínimo / agotados
    const condicionesItems: SQL[] = [
      eq(productos.is_active, 1),
      eq(inventario_sucursal.sucursal_id, params.sucursalId),
    ];
    if (params.soloBajoMinimo) {
      condicionesItems.push(lte(inventario_sucursal.stock_actual, inventario_sucursal.stock_minimo));
    } else {
      // Por defecto lista productos que requieren atención (bajo o agotado)
      condicionesItems.push(lte(inventario_sucursal.stock_actual, inventario_sucursal.stock_minimo));
    }

    const [countRow] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(inventario_sucursal)
      .innerJoin(productos, eq(inventario_sucursal.producto_id, productos.id_producto))
      .where(and(...condicionesItems));

    const total = Number(countRow?.total ?? 0);
    const limit = Math.max(1, params.limit);
    const totalPaginas = Math.ceil(total / limit) || 1;
    const page = Math.min(Math.max(1, params.page), totalPaginas);
    const offset = (page - 1) * limit;

    const itemsRows = await this.db
      .select({
        productoId: productos.id_producto,
        sku: productos.sku,
        nombre: productos.nombre,
        categoriaNombre: categorias.nombre,
        stockActual: inventario_sucursal.stock_actual,
        stockMinimo: inventario_sucursal.stock_minimo,
      })
      .from(inventario_sucursal)
      .innerJoin(productos, eq(inventario_sucursal.producto_id, productos.id_producto))
      .leftJoin(categorias, eq(productos.categoria_id, categorias.id_categoria))
      .where(and(...condicionesItems))
      .orderBy(asc(inventario_sucursal.stock_actual), asc(productos.nombre))
      .limit(limit)
      .offset(offset);

    const items: ItemProductoBajoMinimoDto[] = itemsRows.map((r) => {
      const stockActual = Number(r.stockActual);
      return {
        productoId: r.productoId,
        sku: r.sku,
        nombre: r.nombre,
        categoriaNombre: r.categoriaNombre ?? undefined,
        stockActual,
        stockMinimo: Number(r.stockMinimo),
        estadoStock: stockActual <= 0 ? 'agotado' : 'bajo',
      };
    });

    return {
      sucursalId: params.sucursalId,
      saludStock: {
        optimo,
        bajo,
        agotado,
        totalProductos,
        porcentajeSaludable,
      },
      productosBajoMinimo: {
        items,
        total,
        page,
        limit,
        totalPaginas,
      },
      valorTotalInventario,
    };
  }
}
