/**
 * suscripciones.routes.ts — Planes públicos y cuentas de la web (base central).
 *
 *   GET  /planes             catálogo público de planes
 *   POST /cuentas/registro   crea una cuenta gratuita y abre su sesión
 *   GET  /cuentas/yo         cuenta + plan vigente (sesión de cuenta)
 *   POST /cuentas/logout     cierra la sesión de cuenta
 *
 *   POST /pagos/checkout                    crea el pago de un plan (monto del servidor)
 *   GET  /pagos/:referencia                 datos del pago (página de pago / resultado)
 *   POST /pagos/simulado/:referencia/pagar  paga con tarjeta de prueba y activa el plan
 *   POST /pagos/:referencia/confirmar       reconsulta la pasarela y activa (reintento)
 */

import { Hono } from 'hono';
import { actualizarLogoSchema, iniciarPagoSchema, pagoSimuladoSchema, registroCuentaSchema } from '@inventa/contracts';
import { decodeBase64 } from 'jsr:@std/encoding@^1/base64';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import type { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import { setAuthCookies } from '../utils/cookie.ts';
import { COOKIE_EMPRESA } from '../middlewares/empresa.middleware.ts';
import type { AppContainer } from '@inventa/composition';
import { createIpRateLimiter } from '../middlewares/rate-limit.middleware.ts';
import { presentResult } from '../presenters/result.presenter.ts';
import { safeHandler } from '../utils/handler.ts';
import { cerrarSesionCuenta, cuentaMiddleware, fijarSesionCuenta, obtenerCuentaId } from '../utils/cuenta-sesion.ts';

/** Bytes del PNG a partir de base64 (acepta el prefijo data:image/png;base64,). */
function decodificarLogo(base64: string): Uint8Array {
  try {
    return decodeBase64(base64.replace(/^data:image\/png;base64,/, ''));
  } catch {
    return new Uint8Array(0); // el analizador lo rechaza como logo vacío
  }
}

/** Respuesta con el PNG del logo; ?v=<versión> permite cachearlo sin riesgo de verlo viejo. */
function responderLogo(c: Context, png: Uint8Array | null) {
  if (!png) return c.json({ error: 'LOGO_NO_ENCONTRADO', message: 'No hay logo.' }, 404);
  return new Response(png.slice(), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': c.req.query('v') ? 'private, max-age=31536000, immutable' : 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

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

    const resultado = await container.suscripciones.registrarCuenta.execute({
      ...validacion.data,
      logoPng: decodificarLogo(validacion.data.logoPng),
    });
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
      cuenta: {
        id: cuenta.id,
        nombre: cuenta.nombre,
        email: cuenta.email,
        empresaId: cuenta.empresaId,
        colorPrincipal: cuenta.colorPrincipal,
        logoVersion: cuenta.logoVersion,
      },
      suscripcion: suscripcion && { ...suscripcion, venceEn: suscripcion.venceEn.toISOString() },
    });
  }));

  api.post('/cuentas/logout', (c) => {
    cerrarSesionCuenta(c);
    return c.json({ ok: true });
  });

  // ─── Marca: logo y color principal ────────────────────────────────────────
  api.get('/cuentas/logo', cuentaMiddleware(container), safeHandler(async (c) =>
    responderLogo(c, await container.suscripciones.logoDeCuenta(obtenerCuentaId(c)))));

  api.put('/cuentas/logo', cuentaMiddleware(container), registroRateLimiter, safeHandler(async (c) => {
    const validacion = actualizarLogoSchema.safeParse(await c.req.json().catch(() => null));
    if (!validacion.success) return c.json({ error: 'VALIDATION_ERROR', issues: validacion.error.errors }, 400);
    const resultado = await container.suscripciones.actualizarLogo.execute({
      cuentaId: obtenerCuentaId(c),
      logoPng: decodificarLogo(validacion.data.logoPng),
    });
    return presentResult(c, resultado);
  }));

  /** Marca de la empresa del usuario del panel (color principal y versión del logo). */
  api.get('/empresa/marca', authMiddleware(container), safeHandler(async (c) =>
    presentResult(c, await container.suscripciones.obtenerMarcaEmpresa.execute(container.multiempresa.empresaActual()))));

  api.get('/empresa/logo', authMiddleware(container), safeHandler(async (c) =>
    responderLogo(c, await container.suscripciones.logoDeEmpresa(container.multiempresa.empresaActual()))));

  // ─── Pagos ────────────────────────────────────────────────────────────────
  const pagosRateLimiter = createIpRateLimiter({
    ventanaMs: 60 * 1000,
    maxPeticiones: 10,
    mensaje: 'Demasiados intentos de pago desde esta IP. Espera un minuto.',
  });

  /** Tras un pago aprobado: abre la sesión del panel del dueño en su empresa. */
  const abrirPanelDelDueno = async (c: Context, cuentaId: string, empresaId: number | null) => {
    if (empresaId === null) return;
    const mia = await container.suscripciones.obtenerMiCuenta.execute(cuentaId);
    if (mia.isFailure) return;
    const tokens = await container.suscripciones.emitirSesionDueno(empresaId, mia.value.cuenta.email);
    if (!tokens) return;
    setAuthCookies(c, tokens);
    setCookie(c, COOKIE_EMPRESA, String(empresaId), {
      httpOnly: true,
      secure: Deno.env.get('NODE_ENV') !== 'development',
      sameSite: 'Lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
  };

  const respuestaConfirmacion = (r: { referencia: string; estado: string; empresaId: number | null; venceEn: Date | null }) => ({
    referencia: r.referencia,
    estado: r.estado,
    empresaId: r.empresaId,
    venceEn: r.venceEn?.toISOString() ?? null,
  });

  api.post('/pagos/checkout', cuentaMiddleware(container), pagosRateLimiter, safeHandler(async (c) => {
    const validacion = iniciarPagoSchema.safeParse(await c.req.json().catch(() => null));
    if (!validacion.success) return c.json({ error: 'VALIDATION_ERROR', issues: validacion.error.errors }, 400);
    const resultado = await container.suscripciones.iniciarPago.execute({ cuentaId: obtenerCuentaId(c), ...validacion.data });
    if (resultado.isFailure) return presentResult(c, resultado);
    return c.json(resultado.value, 201);
  }));

  api.get('/pagos/:referencia', cuentaMiddleware(container), safeHandler(async (c) => {
    return presentResult(c, await container.suscripciones.consultarPago.execute({ cuentaId: obtenerCuentaId(c), referencia: (c.req.param('referencia') ?? '') }));
  }));

  api.post('/pagos/simulado/:referencia/pagar', cuentaMiddleware(container), pagosRateLimiter, safeHandler(async (c) => {
    const cuentaId = obtenerCuentaId(c);
    const referencia = (c.req.param('referencia') ?? '');
    const pago = await container.suscripciones.consultarPago.execute({ cuentaId, referencia });
    if (pago.isFailure) return presentResult(c, pago);
    if (pago.value.estado !== 'pendiente') {
      return c.json({ error: 'PAGO_YA_PROCESADO', message: `Este pago ya fue procesado (${pago.value.estado}).` }, 409);
    }

    const tarjeta = pagoSimuladoSchema.safeParse(await c.req.json().catch(() => null));
    if (!tarjeta.success) return c.json({ error: 'VALIDATION_ERROR', issues: tarjeta.error.errors }, 400);
    const cobro = await container.suscripciones.pasarelaSimulada.cobrar(referencia, tarjeta.data);
    if (!cobro.ok) return c.json({ error: 'TARJETA_INVALIDA', message: cobro.error }, 422);

    const confirmacion = await container.suscripciones.confirmarPago.execute({ cuentaId, referencia });
    if (confirmacion.isFailure) return presentResult(c, confirmacion);
    if (confirmacion.value.estado === 'aprobado') await abrirPanelDelDueno(c, cuentaId, confirmacion.value.empresaId);
    return c.json({ ...respuestaConfirmacion(confirmacion.value), motivo: cobro.estado === 'rechazado' ? cobro.motivo ?? null : null });
  }));

  api.post('/pagos/:referencia/confirmar', cuentaMiddleware(container), pagosRateLimiter, safeHandler(async (c) => {
    const cuentaId = obtenerCuentaId(c);
    const confirmacion = await container.suscripciones.confirmarPago.execute({ cuentaId, referencia: (c.req.param('referencia') ?? '') });
    if (confirmacion.isFailure) return presentResult(c, confirmacion);
    if (confirmacion.value.estado === 'aprobado') await abrirPanelDelDueno(c, cuentaId, confirmacion.value.empresaId);
    return c.json(respuestaConfirmacion(confirmacion.value));
  }));

  return api;
}
