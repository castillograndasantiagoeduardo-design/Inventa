/**
 * database-enrutada.ts — Instancia Drizzle que se enruta a la base de la empresa actual.
 *
 * Los repositorios reciben este objeto una sola vez (Composition Root) y lo usan
 * como cualquier Database. En cada acceso (select, insert, transaction, query…)
 * se resuelve la base de la empresa del contexto activo; sin contexto, la base
 * por defecto. Así el aislamiento por empresa no exige cambiar consultas.
 */

import type { Database } from '../client.ts';
import { obtenerContextoEmpresa } from './contexto-empresa.ts';
import { nombreDbPorDefecto, obtenerDatabaseDeEmpresa } from './bases-empresa.ts';

function databaseActual(): Database {
  const contexto = obtenerContextoEmpresa();
  return obtenerDatabaseDeEmpresa(contexto?.dbNombre ?? nombreDbPorDefecto());
}

export function crearDatabaseEnrutada(): Database {
  return new Proxy({} as Database, {
    get(_objetivo, propiedad) {
      const destino = databaseActual();
      const valor = Reflect.get(destino as object, propiedad, destino);
      return typeof valor === 'function' ? valor.bind(destino) : valor;
    },
    has(_objetivo, propiedad) {
      return Reflect.has(databaseActual() as object, propiedad);
    },
  });
}
