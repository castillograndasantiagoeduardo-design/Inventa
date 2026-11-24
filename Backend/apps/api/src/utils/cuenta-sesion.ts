/**
 * cuenta-sesion.ts — Cookie y middleware de la sesión de una cuenta de la web
 * (cuentas gratuitas y dueños que pagan o renuevan su plan).
 */

import type { Context, Next } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { AppContainer } from '@inventa/composition';

export const COOKIE_CUENTA = 'cuenta_token';
const CLAVE_CUENTA = 'cuentaId';
const isSecure = Deno.env.get('NODE_ENV') !== 'development';

export function fijarSesionCuenta(c: Context, token: string): void {
  setCookie(c, COOKIE_CUENTA, token, { httpOnly: true, secure: isSecure, sameSite: 'Lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
}

export function cerrarSesionCuenta(c: Context): void {
  deleteCookie(c, COOKIE_CUENTA, { path: '/', secure: isSecure, sameSite: 'Lax' });
}

/** Exige una sesión de cuenta válida y deja el id disponible con obtenerCuentaId(c). */
export function cuentaMiddleware(container: AppContainer) {
  return async (c: Context, next: Next) => {
    const token = getCookie(c, COOKIE_CUENTA);
    if (!token) return c.json({ error: 'TOKEN_INVALIDO', message: 'Inicia sesión con tu cuenta.' }, 401);
    try {
      const { cuentaId } = await container.suscripciones.tokenCuenta.validar(token);
      c.set(CLAVE_CUENTA, cuentaId);
    } catch {
      cerrarSesionCuenta(c);
      return c.json({ error: 'TOKEN_INVALIDO', message: 'Tu sesión expiró. Inicia sesión de nuevo.' }, 401);
    }
    await next();
  };
}

export function obtenerCuentaId(c: Context): string {
  return c.get(CLAVE_CUENTA) as string;
}

/** Límite de intentos fallidos de login de cuentas (5 por correo cada 5 minutos). */
const fallos = new Map<string, { cantidad: number; desde: number }>();
const VENTANA_MS = 5 * 60 * 1000;
const MAX_FALLOS = 5;

export function cuentaBloqueada(email: string): number {
  const f = fallos.get(email);
  if (!f || Date.now() - f.desde > VENTANA_MS) return 0;
  return f.cantidad >= MAX_FALLOS ? Math.ceil((f.desde + VENTANA_MS - Date.now()) / 1000) : 0;
}

export function registrarFalloCuenta(email: string): void {
  const f = fallos.get(email);
  if (!f || Date.now() - f.desde > VENTANA_MS) fallos.set(email, { cantidad: 1, desde: Date.now() });
  else f.cantidad++;
}

export function limpiarFallosCuenta(email: string): void {
  fallos.delete(email);
}
