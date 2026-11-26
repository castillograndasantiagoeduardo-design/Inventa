import {
  exportarReporteQuerySchema,
  reporteInventarioQuerySchema,
  reporteProductosQuerySchema,
  reporteVentasQuerySchema,
} from '@inventa/contracts';
import { AppContainer } from '@inventa/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { safeHandler } from '../../utils/handler.ts';
import { obtenerIdentidad } from '../../utils/identidad.ts';

export function generarReporteVentasController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = reporteVentasQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.generarReporteVentas.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}

export function generarReporteProductosController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = reporteProductosQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.generarReporteProductos.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}

export function generarReporteInventarioController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = reporteInventarioQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    return presentResult(
      c,
      await container.administracion.generarReporteInventario.execute({
        usuarioId: obtenerIdentidad(c).usuarioId,
        ...parsed.data,
      }),
    );
  });
}

export function exportarReporteCsvController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = exportarReporteQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const resultado = await container.administracion.exportarReporteCsv.execute({
      usuarioId: obtenerIdentidad(c).usuarioId,
      ...parsed.data,
    });

    if (resultado.isFailure) {
      return presentResult(c, resultado);
    }

    const { contenido, nombreArchivo } = resultado.value;
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    return c.text(contenido);
  });
}
