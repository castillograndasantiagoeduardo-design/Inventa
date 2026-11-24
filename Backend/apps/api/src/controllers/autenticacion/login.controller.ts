import { Context } from 'hono';
import { loginSchema } from '@inventa/contracts';
import { AppContainer } from '@inventa/composition';
import { presentResult } from '../../presenters/result.presenter.ts';
import { setAuthCookies } from '../../utils/cookie.ts';
import { obtenerIp } from '../../utils/ip.ts';
import {
  cuentaBloqueada,
  fijarSesionCuenta,
  limpiarFallosCuenta,
  registrarFalloCuenta,
} from '../../utils/cuenta-sesion.ts';

export function loginController(container: AppContainer) {
  return async (c: Context) => {
    try {
      const body = await c.req.json();
      const result = loginSchema.safeParse(body);

      if (!result.success) {
        return c.json({ error: 'VALIDATION_ERROR', issues: result.error.errors }, 400);
      }

      const { email, password, recordarme } = result.data;
      const correo = email.trim().toLowerCase();

      // Login unificado: un correo que no pertenece a ninguna empresa puede ser una
      // cuenta gratuita de la web (base central). Tiene su propio límite de intentos.
      const empresa = await container.multiempresa.empresaDesdeEmail(correo);
      if (!empresa) {
        const esperar = cuentaBloqueada(correo);
        if (esperar > 0) {
          return c.json({ error: 'LOGIN_BLOQUEADO', message: 'Demasiados intentos fallidos. Intenta más tarde.', segundosRestantes: esperar }, 429);
        }
        const cuenta = await container.suscripciones.iniciarSesionCuenta.execute({ email: correo, password });
        if (cuenta.isSuccess) {
          limpiarFallosCuenta(correo);
          fijarSesionCuenta(c, cuenta.value.token);
          return c.json({ tipo: 'CUENTA', cuenta: cuenta.value.cuenta });
        }
        registrarFalloCuenta(correo);
      }

      const useCaseResult = await container.autenticacion.login.execute({
        email,
        passwordPlain: password,
        ip: obtenerIp(c),
        recordarme,
      });

      if (useCaseResult.isSuccess) {
        setAuthCookies(c, useCaseResult.value, recordarme);
        // Si es el dueño (tiene cuenta en la web), abre también su sesión de cuenta
        // para que pueda ver su plan, pagar o renovar sin volver a iniciar sesión.
        if (empresa) {
          const cuenta = await container.suscripciones.iniciarSesionCuenta.execute({ email: correo, password }).catch(() => null);
          if (cuenta?.isSuccess) fijarSesionCuenta(c, cuenta.value.token);
        }
      }

      return presentResult(c, useCaseResult);
    } catch (e) {
      console.error('[loginController] Error interno:', e);
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error procesando la solicitud' }, 500);
    }
  };
}
