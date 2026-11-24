/**
 * directorio.ts — Correos únicos entre todas las empresas.
 *
 * El directorio central (correo → empresa) enruta el login. Un correo no puede
 * repetirse ni entre empresas ni con una cuenta gratuita de la web.
 */

import { eq } from 'drizzle-orm';
import type { IGestionUsuarioRepository } from '@inventa/core';
import { obtenerContextoEmpresa } from './contexto-empresa.ts';
import { contextoPorDefecto, getCentralDatabase, type CentralDatabase } from './bases-empresa.ts';
import { cuentas, directorioUsuarios } from './central.schema.ts';

export class DirectorioCentral {
  constructor(private readonly central: () => CentralDatabase = getCentralDatabase) {}

  static normalizar(email: string): string {
    return email.trim().toLowerCase();
  }

  /** Empresa dueña del correo en el directorio, o null. */
  async empresaDe(email: string): Promise<number | null> {
    const [fila] = await this.central()
      .select({ empresaId: directorioUsuarios.empresa_id })
      .from(directorioUsuarios)
      .where(eq(directorioUsuarios.email, DirectorioCentral.normalizar(email)))
      .limit(1);
    return fila?.empresaId ?? null;
  }

  /** true si el correo ya pertenece a otra empresa o a una cuenta de la web. */
  async correoOcupadoFueraDe(email: string, empresaId: number): Promise<boolean> {
    const normalizado = DirectorioCentral.normalizar(email);
    const duena = await this.empresaDe(normalizado);
    if (duena !== null && duena !== empresaId) return true;
    const [cuenta] = await this.central()
      .select({ empresaId: cuentas.empresa_id })
      .from(cuentas)
      .where(eq(cuentas.email, normalizado))
      .limit(1);
    return cuenta !== undefined && cuenta.empresaId !== empresaId;
  }

  async registrar(email: string, empresaId: number): Promise<void> {
    await this.central()
      .insert(directorioUsuarios)
      .values({ email: DirectorioCentral.normalizar(email), empresa_id: empresaId })
      .onDuplicateKeyUpdate({ set: { empresa_id: empresaId } });
  }
}

/**
 * Decorador del repositorio de gestión de usuarios: valida el correo contra todas
 * las empresas y registra cada usuario nuevo en el directorio central.
 * Si la base central no está disponible (instalación de una sola empresa), se omite.
 */
export function conDirectorioCentral(
  base: IGestionUsuarioRepository,
  directorio: DirectorioCentral,
): IGestionUsuarioRepository {
  const empresaActual = () => obtenerContextoEmpresa()?.empresaId ?? contextoPorDefecto().empresaId;
  const tolerante = async <T>(fn: () => Promise<T>, siFalla: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return siFalla;
    }
  };

  return new Proxy(base, {
    get(objetivo, propiedad, receptor) {
      if (propiedad === 'existeEmail') {
        return async (email: string) =>
          (await objetivo.existeEmail(email)) ||
          (await tolerante(() => directorio.correoOcupadoFueraDe(email, empresaActual()), false));
      }
      if (propiedad === 'crear') {
        return async (...args: Parameters<IGestionUsuarioRepository['crear']>) => {
          const creado = await objetivo.crear(...args);
          await tolerante(() => directorio.registrar(args[0].email, empresaActual()), undefined);
          return creado;
        };
      }
      const valor = Reflect.get(objetivo, propiedad, receptor);
      return typeof valor === 'function' ? valor.bind(objetivo) : valor;
    },
  });
}
