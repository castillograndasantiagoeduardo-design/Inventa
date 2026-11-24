/**
 * suscripciones.routes.ts — Planes públicos y cuentas de la web (base central).
 *
 *   GET  /planes             catálogo público de planes
 *   POST /cuentas/registro   crea una cuenta gratuita y abre su sesión
 *   GET  /cuentas/yo         cuenta + plan vigente (sesión de cuenta)
 *   POST /cuentas/logout     cierra la sesión de cuenta
 */

import { Hono } from 'hono';
import { registroCuentaSchema } from '@inventa/contracts';
import type { AppContainer } from '@inventa/composition';
import { createIpRateLimiter } from '../middlewares/rate-limit.middleware.ts';
import { presentResult } from '../presenters/result.presenter.ts';
import { safeHandler } from '../utils/handler.ts';
import { cerrarSesionCuenta, cuentaMiddleware, fijarSesionCuenta, obtenerCuentaId } from '../utils/cuenta-sesion.ts';

export function createSuscripcionesRoutes(container: AppContainer) {
  const api = new Hono();

  api.get('/planes', safeHandler(async (c) => {
    const resultado = await container.suscripciones.listarPlanes.execute();
    if (resultado.isFailure) return presentResult(c, resultado);
    return c.json(resultado.value.map(({ orden: _orden, ...plan }) => plan));
  }));

  const registroRateLimiter = createIpRateLimiter({
    ventanaMs: 10 * 60 * 1000,
    maxPeticiones: 5,
    mensaje: 'Demasiados registros desde esta IP. Intenta de nuevo en unos minutos.',
  });

  api.post('/cuentas/registro', registroRateLimiter, safeHandler(async (c) => {
    const validacion = registroCuentaSchema.safeParse(await c.req.json().catch(() => null));
    if (!validacion.success) return c.json({ error: 'VALIDATION_ERROR', issues: validacion.error.errors }, 400);

    const resultado = await container.suscripciones.registrarCuenta.execute(validacion.data);
    if (resultado.isFailure) return presentResult(c, resultado);

    fijarSesionCuenta(c, resultado.value.token);
    return c.json({ cuenta: resultado.value.cuenta }, 201);
  }));

  api.get('/cuentas/yo', cuentaMiddleware(container), safeHandler(async (c) => {
    const resultado = await container.suscripciones.obtenerMiCuenta.execute(obtenerCuentaId(c));
    if (resultado.isFailure) {
      cerrarSesionCuenta(c);
      return presentResult(c, resultado);
    }
    const { cuenta, suscripcion } = resultado.value;
    return c.json({
      cuenta: { id: cuenta.id, nombre: cuenta.nombre, email: cuenta.email, empresaId: cuenta.empresaId },
      suscripcion: suscripcion && { ...suscripcion, venceEn: suscripcion.venceEn.toISOString() },
    });
  }));

  api.post('/cuentas/logout', (c) => {
    cerrarSesionCuenta(c);
    return c.json({ ok: true });
  });

  return api;
}
