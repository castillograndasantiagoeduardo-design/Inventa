/**
 * contexto-empresa.ts — Empresa (tenant) de la petición en curso.
 *
 * Cada petición HTTP/MCP se ejecuta dentro de ejecutarConEmpresa(); el enrutador
 * de base de datos lee este contexto para elegir la base de la empresa. Fuera de
 * un contexto (seeds, tests, scripts) se usa la base por defecto (DB_NAME).
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export interface ContextoEmpresa {
  empresaId: number;
  /** Nombre de la base MySQL de la empresa. */
  dbNombre: string;
}

const almacen = new AsyncLocalStorage<ContextoEmpresa>();

/** Ejecuta `fn` con la empresa indicada como contexto activo. */
export function ejecutarConEmpresa<T>(contexto: ContextoEmpresa, fn: () => T): T {
  return almacen.run(contexto, fn);
}

/** Empresa de la petición actual, o undefined fuera de un contexto. */
export function obtenerContextoEmpresa(): ContextoEmpresa | undefined {
  return almacen.getStore();
}

/** Id de la empresa actual (para incluirlo en el JWT), o undefined. */
export function obtenerEmpresaIdActual(): number | undefined {
  return almacen.getStore()?.empresaId;
}
