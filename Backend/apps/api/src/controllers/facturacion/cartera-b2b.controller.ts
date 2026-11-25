import {
  avisarPagoCreditoSchema,
  filtrosAvisosPagoSchema,
  filtrosCarteraB2BSchema,
  filtrosEmpresasB2BSchema,
  registrarAbonoCreditoSchema,
  resolverAvisoPagoSchema,
  solicitarCreditoB2BSchema,
} from '@inventa/contracts';
import type { AppContainer } from '@inventa/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { leerJson, safeHandler } from '../../utils/handler.ts';
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

export function solicitarCreditoB2BController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de cliente requerido.' }, 400);
    }
    const parsed = solicitarCreditoB2BSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.solicitarCreditoB2B.execute({
      clienteId: id,
      ...parsed.data,
      actor,
    });
    if (result.isFailure) return presentResult(c, result);
    return c.json({
      cliente: result.value.cliente.toJSON(),
      evaluacionCredito: result.value.evaluacionCredito,
      alertaSuperAdminEnviada: result.value.alertaSuperAdminEnviada,
    });
  });
}

export function registrarAbonoCreditoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de crédito requerido.' }, 400);
    }
    const parsed = registrarAbonoCreditoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.registrarAbonoCredito.execute({
      creditoId: id,
      monto: parsed.data.monto,
      actor,
    });
    return presentResult(c, result, 201);
  });
}

export function avisarPagoCreditoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de crédito requerido.' }, 400);
    }
    const parsed = avisarPagoCreditoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.avisarPagoCredito.execute({
      creditoId: id,
      ...parsed.data,
      actor,
    });
    return presentResult(c, result, 201);
  });
}

export function resolverAvisoPagoController(container: AppContainer) {
  return safeHandler(async (c) => {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ error: 'VALIDATION_ERROR', message: 'ID de aviso de pago requerido.' }, 400);
    }
    const parsed = resolverAvisoPagoSchema.safeParse(await leerJson(c));
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', issues: parsed.error.errors }, 400);
    }
    const actor = obtenerActor(c);
    const result = await container.facturacion.resolverAvisoPago.execute({
      avisoId: id,
      ...parsed.data,
      actor,
    });
    return presentResult(c, result, 200);
  });
}
