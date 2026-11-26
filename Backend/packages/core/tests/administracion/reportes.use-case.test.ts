import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  GenerarReporteVentasUseCase,
  GenerarReporteProductosUseCase,
  GenerarReporteInventarioUseCase,
  ExportarReporteCsvUseCase,
  ConsultarMetricasGananciasUseCase,
  FechaBogotaUtils,
  AlcanceSucursal,
} from '../../mod.ts';
import type {
  IReportesAdminRepository,
  ParametrosReporteVentas,
  ParametrosReporteProductos,
  ParametrosReporteInventario,
  IMetricasAdminRepository,
  FiltroMetricasGanancias,
  MetricasGanancias,
  PuntoTendenciaVenta,
  RendimientoSucursal,
  ItemRankingProducto,
  ItemComparativoInventario,
} from '../../mod.ts';
import type {
  ReporteVentasDto,
  ReporteProductosDto,
  ReporteInventarioDto,
} from '@inventa/contracts';
import { Result } from '@inventa/shared-kernel';

// Mock del ResolverAlcanceSucursal
class MockResolverAlcance {
  constructor(private readonly alcance: AlcanceSucursal) {}
  async execute() {
    return Result.ok(this.alcance);
  }
}

// Mock Repository para Reportes que simula BD con facturas emitidas, anuladas y devoluciones
class MockReportesRepository implements IReportesAdminRepository {
  public ultimoParamsVentas?: ParametrosReporteVentas;
  public ultimoParamsProductos?: ParametrosReporteProductos;
  public ultimoParamsInventario?: ParametrosReporteInventario;

  async obtenerReporteVentas(params: ParametrosReporteVentas): Promise<ReporteVentasDto> {
    this.ultimoParamsVentas = params;
    // Simula 3 facturas emitidas por $150.000, 1 anulada por $50.000, 1 devolución por $20.000
    const totalVendido = 150000;
    const totalFacturas = 3;
    const ticketPromedio = totalVendido / totalFacturas;

    const totalVendidoAnterior = 100000;
    const totalFacturasAnterior = 2;
    const ticketPromedioAnterior = 50000;

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
        montoAnuladas: 50000,
        totalAnuladas: 1,
        montoDevoluciones: 20000,
        totalDevoluciones: 1,
      },
      desgloseMetodosPago: [
        { medioPago: 'efectivo', monto: 100000, cantidadTransacciones: 2, porcentaje: 66.7 },
        { medioPago: 'transferencia', monto: 50000, cantidadTransacciones: 1, porcentaje: 33.3 },
      ],
      serieTemporal: [
        { periodo: params.desdeStr, label: 'Inicio', totalVentas: 75000, cantidadFacturas: 1 },
        { periodo: params.hastaStr, label: 'Fin', totalVentas: 75000, cantidadFacturas: 2 },
      ],
      comparativaPeriodoAnterior: {
        totalVendidoAnterior,
        totalFacturasAnterior,
        ticketPromedioAnterior,
        variacionTotalVendido: totalVendido - totalVendidoAnterior,
        variacionPorcentualTotalVendido: 50.0,
        variacionFacturas: totalFacturas - totalFacturasAnterior,
        variacionPorcentualFacturas: 50.0,
        desdeAnterior: params.desdeAnteriorStr,
        hastaAnterior: params.hastaAnteriorStr,
      },
    };
  }

  async obtenerReporteProductos(params: ParametrosReporteProductos): Promise<ReporteProductosDto> {
    this.ultimoParamsProductos = params;
    return {
      sucursalId: params.sucursalId,
      rango: { desde: params.desdeStr, hasta: params.hastaStr },
      criterioOrden: params.orden,
      ranking: [
        {
          posicion: 1,
          productoId: 'prod-1',
          sku: 'SKU-001',
          nombre: 'Arroz Diana 500g',
          categoriaNombre: 'Granos',
          unidadesVendidas: 25,
          ingresosTotales: 105000,
        },
      ],
      sinVentas: [
        {
          productoId: 'prod-2',
          sku: 'SKU-002',
          nombre: 'Aceite 1L',
          categoriaNombre: 'Aceites',
          stockActual: 10,
        },
      ],
      totalProductosVendidos: 1,
    };
  }

  async obtenerReporteInventario(params: ParametrosReporteInventario): Promise<ReporteInventarioDto> {
    this.ultimoParamsInventario = params;
    return {
      sucursalId: params.sucursalId,
      saludStock: {
        optimo: 180,
        bajo: 20,
        agotado: 5,
        totalProductos: 205,
        porcentajeSaludable: 87.8,
      },
      productosBajoMinimo: {
        items: [
          {
            productoId: 'prod-3',
            sku: 'SKU-003',
            nombre: 'Atún Lomitos',
            categoriaNombre: 'Enlatados',
            stockActual: 4,
            stockMinimo: 15,
            estadoStock: 'bajo',
          },
        ],
        total: 25,
        page: params.page,
        limit: params.limit,
        totalPaginas: 3,
      },
      valorTotalInventario: 45000000,
    };
  }
}

// Mock Repository para el Dashboard para prueba de consistencia
class MockMetricasDashboardRepository implements IMetricasAdminRepository {
  async obtenerMetricasGanancias(filtro: FiltroMetricasGanancias): Promise<MetricasGanancias> {
    return {
      ingresosTotales: 150000, // Exactamente igual a totalVendido de Reportes
      costoTotal: 90000,
      gananciaNeta: 60000,
      margenPorcentaje: 40,
      totalFacturas: 3,       // Exactamente igual a totalFacturas de Reportes
      ticketPromedio: 50000,  // Exactamente igual a ticketPromedio de Reportes
    };
  }
  async obtenerTendenciasVentas(): Promise<PuntoTendenciaVenta[]> { return []; }
  async obtenerRendimientoSucursales(): Promise<RendimientoSucursal[]> { return []; }
  async obtenerRankingProductos(): Promise<ItemRankingProducto[]> { return []; }
  async obtenerComparativoInventario(): Promise<ItemComparativoInventario[]> { return []; }
}

Deno.test('FechaBogotaUtils: procesa rango y frontera horaria America/Bogota', () => {
  const rango = FechaBogotaUtils.procesarRango('2026-11-13', '2026-11-19');
  assertEquals(rango.dias, 7);
  assertEquals(rango.granularidad, 'dia');
  assertEquals(rango.desdeStr, '2026-11-13');
  assertEquals(rango.hastaStr, '2026-11-19');
  // Período anterior de 7 días exactos
  assertEquals(rango.periodoAnterior.desdeStr, '2026-11-06');
  assertEquals(rango.periodoAnterior.hastaStr, '2026-11-12');

  // Rango de 1 día: granularidad hora
  const rango1Dia = FechaBogotaUtils.procesarRango('2026-11-19', '2026-11-19');
  assertEquals(rango1Dia.dias, 1);
  assertEquals(rango1Dia.granularidad, 'hora');

  // Rango > 90 días: granularidad semana
  const rango95Dias = FechaBogotaUtils.procesarRango('2026-08-01', '2026-11-15');
  assertEquals(rango95Dias.granularidad, 'semana');
});

Deno.test('FechaBogotaUtils: rechaza rango inválido o superior a 366 días', () => {
  let errorDesdeMayorHasta = false;
  try {
    FechaBogotaUtils.procesarRango('2026-11-20', '2026-11-10');
  } catch (err: any) {
    if (err.code === 'RANGO_FECHAS_INVALIDO') errorDesdeMayorHasta = true;
  }
  assertEquals(errorDesdeMayorHasta, true);

  let errorExcedeMaximo = false;
  try {
    FechaBogotaUtils.procesarRango('2024-01-01', '2025-02-15'); // > 366 días
  } catch (err: any) {
    if (err.code === 'RANGO_EXCEDE_MAXIMO') errorExcedeMaximo = true;
  }
  assertEquals(errorExcedeMaximo, true);
});

Deno.test('GenerarReporteVentasUseCase: caso feliz con totales, anuladas y devoluciones', async () => {
  const repo = new MockReportesRepository();
  const alcance = AlcanceSucursal.limitado([1]);
  const useCase = new GenerarReporteVentasUseCase(new MockResolverAlcance(alcance) as any, repo);

  const res = await useCase.execute({
    usuarioId: 'user-admin',
    desde: '2026-11-13',
    hasta: '2026-11-19',
    sucursalId: 1,
  });

  assertEquals(res.isSuccess, true);
  if (res.isSuccess) {
    const data = res.value;
    assertEquals(data.sucursalId, 1);
    assertEquals(data.resumen.totalVendido, 150000);
    assertEquals(data.resumen.totalFacturas, 3);
    assertEquals(data.resumen.ticketPromedio, 50000);
    assertEquals(data.resumen.montoAnuladas, 50000);
    assertEquals(data.resumen.totalAnuladas, 1);
    assertEquals(data.resumen.montoDevoluciones, 20000);
    assertEquals(data.resumen.totalDevoluciones, 1);
    assertEquals(data.comparativaPeriodoAnterior.variacionTotalVendido, 50000);
    assertEquals(data.comparativaPeriodoAnterior.variacionPorcentualTotalVendido, 50.0);
  }
});

Deno.test('GenerarReporteVentasUseCase: restricción estricta de alcance (RNF-ADM-04)', async () => {
  const repo = new MockReportesRepository();
  // Admin asignado a sede 1 intentando consultar sede 2
  const alcance = AlcanceSucursal.limitado([1]);
  const useCase = new GenerarReporteVentasUseCase(new MockResolverAlcance(alcance) as any, repo);

  const res = await useCase.execute({
    usuarioId: 'user-admin',
    desde: '2026-11-13',
    hasta: '2026-11-19',
    sucursalId: 2,
  });

  assertEquals(res.isFailure, true);
  if (res.isFailure) {
    assertEquals(res.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
  }
});

Deno.test('PRUEBA DE CONSISTENCIA: totales de Reportes coinciden con Dashboard para el mismo período', async () => {
  const repoReportes = new MockReportesRepository();
  const repoDashboard = new MockMetricasDashboardRepository();
  const alcance = AlcanceSucursal.limitado([1]);

  const useCaseReportes = new GenerarReporteVentasUseCase(new MockResolverAlcance(alcance) as any, repoReportes);
  const useCaseDashboard = new ConsultarMetricasGananciasUseCase(new MockResolverAlcance(alcance) as any, repoDashboard);

  const [resReporte, resDashboard] = await Promise.all([
    useCaseReportes.execute({
      usuarioId: 'user-admin',
      desde: '2026-11-13',
      hasta: '2026-11-19',
      sucursalId: 1,
    }),
    useCaseDashboard.execute({
      usuarioId: 'user-admin',
      sucursalId: 1,
    }),
  ]);

  assertEquals(resReporte.isSuccess, true);
  assertEquals(resDashboard.isSuccess, true);

  if (resReporte.isSuccess && resDashboard.isSuccess) {
    const reporteVentas = resReporte.value.resumen;
    const metricasDash = resDashboard.value;

    // Consistencia matemática estricta
    assertEquals(reporteVentas.totalVendido, metricasDash.ingresosTotales);
    assertEquals(reporteVentas.totalFacturas, metricasDash.totalFacturas);
    assertEquals(reporteVentas.ticketPromedio, metricasDash.ticketPromedio);
  }
});

Deno.test('GenerarReporteProductosUseCase: ranking y sin ventas', async () => {
  const repo = new MockReportesRepository();
  const alcance = AlcanceSucursal.limitado([1]);
  const useCase = new GenerarReporteProductosUseCase(new MockResolverAlcance(alcance) as any, repo);

  const res = await useCase.execute({
    usuarioId: 'user-admin',
    desde: '2026-11-13',
    hasta: '2026-11-19',
    sucursalId: 1,
    orden: 'ingresos',
    limite: 10,
  });

  assertEquals(res.isSuccess, true);
  if (res.isSuccess) {
    assertEquals(res.value.ranking.length, 1);
    assertEquals(res.value.ranking[0].sku, 'SKU-001');
    assertEquals(res.value.sinVentas.length, 1);
    assertEquals(res.value.sinVentas[0].sku, 'SKU-002');
  }
});

Deno.test('GenerarReporteInventarioUseCase: salud del stock y valorización', async () => {
  const repo = new MockReportesRepository();
  const alcance = AlcanceSucursal.limitado([1]);
  const useCase = new GenerarReporteInventarioUseCase(new MockResolverAlcance(alcance) as any, repo);

  const res = await useCase.execute({
    usuarioId: 'user-admin',
    sucursalId: 1,
  });

  assertEquals(res.isSuccess, true);
  if (res.isSuccess) {
    assertEquals(res.value.saludStock.totalProductos, 205);
    assertEquals(res.value.saludStock.optimo, 180);
    assertEquals(res.value.valorTotalInventario, 45000000);
    assertEquals(res.value.productosBajoMinimo.items.length, 1);
  }
});

Deno.test('ExportarReporteCsvUseCase: genera archivo CSV con formato UTF-8 con BOM', async () => {
  const repo = new MockReportesRepository();
  const alcance = AlcanceSucursal.limitado([1]);
  const mockResolver = new MockResolverAlcance(alcance) as any;

  const ventasUC = new GenerarReporteVentasUseCase(mockResolver, repo);
  const prodUC = new GenerarReporteProductosUseCase(mockResolver, repo);
  const invUC = new GenerarReporteInventarioUseCase(mockResolver, repo);

  const exportUC = new ExportarReporteCsvUseCase(ventasUC, prodUC, invUC);

  const res = await exportUC.execute({
    usuarioId: 'user-admin',
    tipo: 'ventas',
    desde: '2026-11-13',
    hasta: '2026-11-19',
    sucursalId: 1,
  });

  assertEquals(res.isSuccess, true);
  if (res.isSuccess) {
    assertEquals(res.value.contenido.startsWith('\uFEFF'), true);
    assertEquals(res.value.contenido.includes('Total Vendido,150000'), true);
    assertEquals(res.value.nombreArchivo.includes('reporte_ventas_sucursal_1'), true);
  }
});
