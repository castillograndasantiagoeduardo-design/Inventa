/**
 * bases-empresa.ts — Conexiones por empresa y acceso a la base central.
 *
 * - getCentralDatabase(): base central (DB_CENTRAL_NAME, por defecto inventa_central).
 * - obtenerDatabaseDeEmpresa(): instancia Drizzle de la base de una empresa (pool cacheado).
 * - ResolutorEmpresas: traduce id de empresa o correo a { empresaId, dbNombre }.
 *
 * Si la base central no existe todavía (equipos que no han migrado), el resolutor
 * devuelve null y la API sigue usando la base por defecto (empresa n.º 1).
 */

import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import * as schema from '../schema/index.ts';
import { getDatabase, type Database } from '../client.ts';
import { centralSchema, directorioUsuarios, empresas } from './central.schema.ts';
import type { ContextoEmpresa } from './contexto-empresa.ts';

export type CentralDatabase = MySql2Database<typeof centralSchema>;

const NOMBRE_DB_VALIDO = /^[a-z0-9_]{1,64}$/;

function configConexion() {
  return {
    host: Deno.env.get('DB_HOST') ?? 'localhost',
    port: Number(Deno.env.get('DB_PORT') ?? 3306),
    user: Deno.env.get('DB_USER') ?? 'inventa_user',
    password: Deno.env.get('DB_PASSWORD') || '',
  };
}

function crearPool(database: string, connectionLimit: number): mysql.Pool {
  const pool = mysql.createPool({
    ...configConexion(),
    database,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
  });
  // Misma regla que client.ts: la sesión MySQL en UTC.
  pool.on('connection', (conexion) => {
    conexion.query("SET time_zone = '+00:00'");
  });
  return pool;
}

/** Nombre de la base por defecto (empresa n.º 1 / instalación de una sola empresa). */
export function nombreDbPorDefecto(): string {
  return Deno.env.get('DB_NAME') ?? 'inventa';
}

/** Contexto de la empresa por defecto (no requiere la base central). */
export function contextoPorDefecto(): ContextoEmpresa {
  return { empresaId: Number(Deno.env.get('EMPRESA_POR_DEFECTO_ID') ?? 1), dbNombre: nombreDbPorDefecto() };
}

// ─── Bases de cada empresa ───────────────────────────────────────────────────
const basesEmpresa = new Map<string, { pool: mysql.Pool; db: Database }>();

export function obtenerDatabaseDeEmpresa(dbNombre: string): Database {
  if (dbNombre === nombreDbPorDefecto()) return getDatabase();
  if (!NOMBRE_DB_VALIDO.test(dbNombre)) throw new Error(`Nombre de base de empresa inválido: ${dbNombre}`);
  let entrada = basesEmpresa.get(dbNombre);
  if (!entrada) {
    const pool = crearPool(dbNombre, Number(Deno.env.get('DB_POOL_EMPRESA') ?? 5));
    entrada = { pool, db: drizzle(pool, { schema, mode: 'default' }) };
    basesEmpresa.set(dbNombre, entrada);
  }
  return entrada.db;
}

// ─── Base central ────────────────────────────────────────────────────────────
let poolCentral: mysql.Pool | null = null;
let dbCentral: CentralDatabase | null = null;

export function getCentralDatabase(): CentralDatabase {
  if (dbCentral) return dbCentral;
  poolCentral = crearPool(Deno.env.get('DB_CENTRAL_NAME') ?? 'inventa_central', 5);
  dbCentral = drizzle(poolCentral, { schema: centralSchema, mode: 'default' });
  return dbCentral;
}

/** Cierra todos los pools de empresas y el central (tests o apagado). */
export async function cerrarBasesEmpresa(): Promise<void> {
  for (const { pool } of basesEmpresa.values()) await pool.end();
  basesEmpresa.clear();
  if (poolCentral) {
    await poolCentral.end();
    poolCentral = null;
    dbCentral = null;
  }
}

// ─── Resolución de empresa ───────────────────────────────────────────────────
const TTL_CACHE_MS = 60_000;

export class ResolutorEmpresas {
  private readonly cache = new Map<number, { contexto: ContextoEmpresa | null; expira: number }>();
  private avisoCentralNoDisponible = false;

  constructor(private readonly central: () => CentralDatabase = getCentralDatabase) {}

  /** Empresa por id; null si no existe, está aprovisionándose o la central no está disponible. */
  async porId(empresaId: number): Promise<ContextoEmpresa | null> {
    if (!Number.isInteger(empresaId) || empresaId <= 0) return null;
    const enCache = this.cache.get(empresaId);
    if (enCache && enCache.expira > Date.now()) return enCache.contexto;

    try {
      const [fila] = await this.central()
        .select({ id: empresas.id_empresa, db: empresas.db_nombre, estado: empresas.estado })
        .from(empresas)
        .where(eq(empresas.id_empresa, empresaId))
        .limit(1);
      const contexto =
        fila && fila.estado !== 'aprovisionando' && NOMBRE_DB_VALIDO.test(fila.db)
          ? { empresaId: fila.id, dbNombre: fila.db }
          : null;
      this.cache.set(empresaId, { contexto, expira: Date.now() + TTL_CACHE_MS });
      return contexto;
    } catch (error) {
      this.avisarCentralNoDisponible(error);
      return null;
    }
  }

  /** Empresa a la que pertenece un correo (directorio central). */
  async porEmail(email: string): Promise<ContextoEmpresa | null> {
    const normalizado = email.trim().toLowerCase();
    if (!normalizado) return null;
    try {
      const [fila] = await this.central()
        .select({ empresaId: directorioUsuarios.empresa_id })
        .from(directorioUsuarios)
        .where(eq(directorioUsuarios.email, normalizado))
        .limit(1);
      return fila ? await this.porId(fila.empresaId) : null;
    } catch (error) {
      this.avisarCentralNoDisponible(error);
      return null;
    }
  }

  /** Olvida la caché (tras crear o cambiar una empresa). */
  invalidar(empresaId?: number): void {
    if (empresaId === undefined) this.cache.clear();
    else this.cache.delete(empresaId);
  }

  private avisarCentralNoDisponible(error: unknown): void {
    if (this.avisoCentralNoDisponible) return;
    this.avisoCentralNoDisponible = true;
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  Base central no disponible (${msg}). Se usa la empresa por defecto.`);
  }
}
