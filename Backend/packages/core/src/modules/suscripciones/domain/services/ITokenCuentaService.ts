/** Sesión de una cuenta de la web (independiente de la sesión del panel de una empresa). */
export interface ITokenCuentaService {
  generar(cuentaId: string): Promise<string>;
  /** Lanza error si el token es inválido o expiró. */
  validar(token: string): Promise<{ cuentaId: string }>;
}
