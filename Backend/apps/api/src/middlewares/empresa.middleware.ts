/**
 * empresa.middleware.ts — Resuelve la empresa (tenant) de cada petición y ejecuta
 * el resto de la cadena dentro de su contexto: todas las consultas van a su base.
 *
 * Orden de resolución:
 *   1. Access token válido (cookie o Bearer) con el claim `emp` firmado.
 *   2. Rutas públicas por correo (login, olvidé mi contraseña, verificar código):
 *      el correo del cuerpo se busca en el directorio central.
 *   3. Cookie `inventa_emp` (refresh, 2FA y restablecer contraseña continúan
 *      en la empresa donde empezó el flujo). Una cookie alterada solo dirige a
 *      otra base donde el token/código no existe, así que no expone datos.
 *   4. Empresa por defecto (instalación de una sola empresa).
 */

import type { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { AppContainer } from '@inventa/composition';
import { getTokensFromCookies } from '../utils/cookie.ts';

export const COOKIE_EMPRESA = 'inventa_emp';

const RUTAS_POR_EMAIL = new Set([
  '/login', '/auth/login',
  '/forgot-password', '/auth/forgot-password',
  '/verify-code', '/auth/verify-code',
  '/recuperar-password/solicitar', '/auth/recuperar-password/solicitar',
]);

const isSecure = Deno.env.get('NODE_ENV') !== 'development';

function tokenDeLaPeticion(c: Context): string | undefined {
  const desdeCookie = getTokensFromCookies(c).accessToken;
  if (desdeCookie) return desdeCookie;
  const auth = c.req.header('Authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
}

export function empresaMiddleware(container: AppContainer) {
  const mt = container.multiempresa;

  return async (c: Context, next: Next) => {
    let contexto = null;
    let fijarCookie = false;

    const token = tokenDeLaPeticion(c);
    if (token) contexto = await mt.empresaDesdeToken(token);

    if (!contexto && c.req.method === 'POST' && RUTAS_POR_EMAIL.has(c.req.path)) {
      const cuerpo = await c.req.json().catch(() => null) as { email?: unknown } | null;
      if (typeof cuerpo?.email === 'string') {
        contexto = await mt.empresaDesdeEmail(cuerpo.email);
        fijarCookie = contexto !== null;
      }
    }

    if (!contexto) {
      const desdeCookie = Number(getCookie(c, COOKIE_EMPRESA));
      if (Number.isInteger(desdeCookie) && desdeCookie > 0) contexto = await mt.empresaPorId(desdeCookie);
    }

    contexto ??= mt.contextoPorDefecto();

    if (fijarCookie) {
      setCookie(c, COOKIE_EMPRESA, String(contexto.empresaId), {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'Lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    await mt.ejecutarConEmpresa(contexto, () => next());
  };
}
