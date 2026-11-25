import {
  filtrosAvisosPagoSchema,
  filtrosCarteraB2BSchema,
  filtrosEmpresasB2BSchema,
} from '@inventa/contracts';
import type { AppContainer } from '@inventa/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { safeHandler } from '../../utils/handler.ts';
import { obtenerActor } from '../../utils/actor.ts';

export function listarEmpresasB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosEmpresasB2BSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.listarEmpresasB2B.execute({
      filtros: parsed.data,
      usuarioId: actor.usuarioId,
    });
    return presentResult(c, result);
  });
}

export function obtenerEmpresaB2BDetalleController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de empresa B2B requerido.' }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.obtenerEmpresaB2BDetalle.execute({
      clienteId: id,
      usuarioId: actor.usuarioId,
    });
    return presentResult(c, result);
  });
}

export function listarCarteraB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosCarteraB2BSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.listarCartera.execute({
      filtros: parsed.data,
      usuarioId: actor.usuarioId,
    });
    return presentResult(c, result);
  });
}

export function listarEmpresasEnMoraController(container: AppContainer) {
  return safeHandler(async (c) => {
    const actor = obtenerActor(c);
    const result = await container.facturacion.listarEmpresasEnMora.execute({
      usuarioId: actor.usuarioId,
    });
    return presentResult(c, result);
  });
}

export function listarAvisosPagoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const parsed = filtrosAvisosPagoSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.listarAvisosPago.execute({
      filtros: parsed.data,
      usuarioId: actor.usuarioId,
    });
    return presentResult(c, result);
  });
}
