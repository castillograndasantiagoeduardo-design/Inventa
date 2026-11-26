import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  reporteVentasQuerySchema,
  reporteProductosQuerySchema,
  reporteInventarioQuerySchema,
  exportarReporteQuerySchema,
} from '../../../../../Shared/contracts/src/administracion/reportes.schema';
import {
  REPORTS_SECTION_TABS,
  BRANCH_NAV_ITEMS,
  isBranchRouteActive,
} from '../config/branch-navigation.config';
import {
  obtenerRangoPreset,
  validarRangoFechas,
  formatearVariacion,
  formatearFechaCorta,
} from '../lib/date-range.utils';

describe('branch-reports — Navegación, utilidades de fecha y contratos de Reportes', () => {
  describe('Navegación: REPORTS_SECTION_TABS', () => {
    it('define las 3 pestañas requeridas del submódulo de reportes', () => {
      assert.equal(REPORTS_SECTION_TABS.length, 3);
      assert.deepEqual(
        REPORTS_SECTION_TABS.map((t) => t.id),
        ['ventas', 'productos', 'inventario'],
      );
      assert.deepEqual(
        REPORTS_SECTION_TABS.map((t) => t.href),
        [
          '/admin-sucursal/reportes',
          '/admin-sucursal/reportes/productos',
          '/admin-sucursal/reportes/inventario',
        ],
      );
    });

    it('la pestaña "ventas" tiene exact: true para no solapar con subrutas', () => {
      const ventasTab = REPORTS_SECTION_TABS.find((t) => t.id === 'ventas')!;
      assert.equal(ventasTab.exact, true);
      assert.equal(isBranchRouteActive('/admin-sucursal/reportes', ventasTab.href, ventasTab.exact), true);
      assert.equal(isBranchRouteActive('/admin-sucursal/reportes/productos', ventasTab.href, ventasTab.exact), false);
      assert.equal(isBranchRouteActive('/admin-sucursal/reportes/inventario', ventasTab.href, ventasTab.exact), false);
    });

    it('las pestañas secundarias se activan con sus respectivas rutas', () => {
      const prodTab = REPORTS_SECTION_TABS.find((t) => t.id === 'productos')!;
      const invTab = REPORTS_SECTION_TABS.find((t) => t.id === 'inventario')!;
      assert.equal(isBranchRouteActive('/admin-sucursal/reportes/productos', prodTab.href, prodTab.exact), true);
      assert.equal(isBranchRouteActive('/admin-sucursal/reportes/inventario', invTab.href, invTab.exact), true);
    });

    it('el ítem Reportes en el sidebar está en categoría OPERACIONES', () => {
      const navItem = BRANCH_NAV_ITEMS.find((i) => i.id === 'reportes')!;
      assert.ok(navItem);
      assert.equal(navItem.categoria, 'OPERACIONES');
      assert.equal(navItem.href, '/admin-sucursal/reportes');
      assert.equal(isBranchRouteActive('/admin-sucursal/reportes/productos', navItem.href, navItem.exact), true);
    });
  });

  describe('Utilidades de fecha: date-range.utils', () => {
    it('obtenerRangoPreset genera rangos consistentes YYYY-MM-DD', () => {
      const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
      const p7d = obtenerRangoPreset('7d');
      assert.match(p7d.desde, regexFecha);
      assert.match(p7d.hasta, regexFecha);
      assert.ok(p7d.desde <= p7d.hasta);

      const p30d = obtenerRangoPreset('30d');
      assert.match(p30d.desde, regexFecha);
      assert.match(p30d.hasta, regexFecha);
      assert.ok(p30d.desde <= p30d.hasta);

      const pHoy = obtenerRangoPreset('hoy');
      assert.equal(pHoy.desde, pHoy.hasta);
    });

    it('validarRangoFechas valida correctamente rango normal', () => {
      const res = validarRangoFechas('2026-11-01', '2026-11-19');
      assert.equal(res.valido, true);
      assert.equal(res.error, undefined);
      assert.equal(res.dias, 19);
    });

    it('validarRangoFechas rechaza cuando falta alguna fecha o formato inválido', () => {
      assert.equal(validarRangoFechas('', '2026-11-19').valido, false);
      assert.equal(validarRangoFechas('invalido', '2026-11-19').valido, false);
    });

    it('validarRangoFechas rechaza si desde > hasta', () => {
      const res = validarRangoFechas('2026-11-20', '2026-11-10');
      assert.equal(res.valido, false);
      assert.ok(res.error?.includes('posterior'));
    });

    it('validarRangoFechas rechaza rangos mayores a 366 días', () => {
      const res = validarRangoFechas('2025-01-01', '2026-02-01'); // > 366 días
      assert.equal(res.valido, false);
      assert.ok(res.error?.includes('366'));
    });

    it('formatearVariacion maneja valores positivos, negativos y nulos', () => {
      const nulo = formatearVariacion(0, null);
      assert.equal(nulo.variante, 'neutral');
      assert.equal(nulo.icono, 'equal');

      const pos = formatearVariacion(1000, 15.4);
      assert.equal(pos.texto, '+15.4%');
      assert.equal(pos.icono, 'up');
      assert.equal(pos.variante, 'success');

      const neg = formatearVariacion(-500, -8.2);
      assert.equal(neg.texto, '-8.2%');
      assert.equal(neg.icono, 'down');
      assert.equal(neg.variante, 'danger');
    });

    it('formatearVariacion respeta el flag inverso para métricas negativas (anuladas/devoluciones)', () => {
      const aumentoMalo = formatearVariacion(200, 12.5, true);
      assert.equal(aumentoMalo.texto, '+12.5%');
      assert.equal(aumentoMalo.variante, 'danger'); // Aumento de anuladas es danger

      const disminucionBuena = formatearVariacion(-100, -5.0, true);
      assert.equal(disminucionBuena.texto, '-5.0%');
      assert.equal(disminucionBuena.variante, 'success'); // Menos anuladas es success
    });

    it('formatearFechaCorta devuelve representación legible', () => {
      const str = formatearFechaCorta('2026-11-19');
      assert.ok(typeof str === 'string');
      assert.ok(str.length > 0);
    });
  });

  describe('Contratos Zod de Reportes (@warengine/contracts)', () => {
    it('reporteVentasQuerySchema parsea fechas y valores numéricos por defecto', () => {
      const parsed = reporteVentasQuerySchema.parse({
        desde: '2026-11-01',
        hasta: '2026-11-19',
      });
      assert.equal(parsed.desde, '2026-11-01');
      assert.equal(parsed.hasta, '2026-11-19');
    });

    it('reporteProductosQuerySchema valida orden y límites', () => {
      const valid = reporteProductosQuerySchema.parse({
        desde: '2026-11-01',
        hasta: '2026-11-19',
        orden: 'unidades',
        limite: 20,
      });
      assert.equal(valid.orden, 'unidades');
      assert.equal(valid.limite, 20);

      assert.throws(() => {
        reporteProductosQuerySchema.parse({
          desde: '2026-11-01',
          hasta: '2026-11-19',
          orden: 'invalido',
        });
      });
    });

    it('reporteInventarioQuerySchema permite paginación y filtro de bajo mínimo', () => {
      const valid = reporteInventarioQuerySchema.parse({
        soloBajoMinimo: 'true',
        page: '2',
        limit: '15',
      });
      assert.equal(valid.soloBajoMinimo, true);
      assert.equal(valid.page, 2);
      assert.equal(valid.limit, 15);
    });

    it('exportarReporteQuerySchema valida el tipo permitido', () => {
      const v = exportarReporteQuerySchema.parse({
        tipo: 'ventas',
        desde: '2026-11-01',
        hasta: '2026-11-19',
      });
      assert.equal(v.tipo, 'ventas');

      assert.throws(() => {
        exportarReporteQuerySchema.parse({
          tipo: 'no_existe',
          desde: '2026-11-01',
          hasta: '2026-11-19',
        });
      });
    });
  });
});
