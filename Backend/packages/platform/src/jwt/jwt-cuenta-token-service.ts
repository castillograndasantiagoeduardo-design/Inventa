import { SignJWT, jwtVerify } from 'jose';
import type { ITokenCuentaService } from '@inventa/core';

/**
 * Token de sesión de una cuenta de la web (7 días). Distinto del token del panel:
 * lleva `purpose: 'cuenta'`, así que no sirve para la API operativa de una empresa.
 */
export class JwtCuentaTokenService implements ITokenCuentaService {
  constructor(private readonly jwtSecret: Uint8Array) {}

  generar(cuentaId: string): Promise<string> {
    return new SignJWT({ cuentaId, purpose: 'cuenta' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.jwtSecret);
  }

  async validar(token: string): Promise<{ cuentaId: string }> {
    const { payload } = await jwtVerify(token, this.jwtSecret);
    if (payload.purpose !== 'cuenta' || typeof payload.cuentaId !== 'string') {
      throw new Error('Token de cuenta inválido.');
    }
    return { cuentaId: payload.cuentaId };
  }
}
