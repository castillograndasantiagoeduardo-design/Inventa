/**
 * aprovisionador.ts — Crea la base de datos de una empresa nueva.
 *
 * Pasos (si alguno falla se deshace lo creado):
 *   1. Registra la empresa en la central (estado 'aprovisionando').
 *   2. CREATE DATABASE inventa_emp_<id> y aplica el esquema operativo completo
 *      (INVENTA_FULL_BD.sql + cambios 002, 007 y 008).
 *   3. Siembra roles y permisos, la sede principal y el usuario dueño (super-admin
 *      de SU empresa; el plan limita sus permisos efectivos).
 *   4. Registra el correo del dueño en el directorio y activa la empresa.
 */

import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { fromFileUrl, join } from 'jsr:@std/path@^1';
import { roles, usuarios } from '../schema/autenticacion.schema.ts';
import { empleados, sucursales } from '../schema/administracion.schema.ts';
import { seedAutenticacion } from '../seeds/autenticacion.seed.ts';
import { getCentralDatabase, obtenerDatabaseDeEmpresa, type CentralDatabase } from './bases-empresa.ts';
import { empresas } from './central.schema.ts';
import { DirectorioCentral } from './directorio.ts';

/** Archivos del esquema operativo, en orden. 009 (rebrand) no se aplica: solo crea la base "inventa". */
export const ARCHIVOS_ESQUEMA_EMPRESA = [
  'INVENTA_FULL_BD.sql',
  'cambios/002-turnos-un-abierto-por-usuario.sql',
  'cambios/007-cierre-administrativo-turnos.sql',
  'cambios/008-cotizaciones-b2b-y-credito.sql',
];

export interface DatosNuevaEmpresa {
  nombre: string;
  nit?: string | null;
  dueno: {
    nombre: string;
    email: string;
    /** Hash Argon2id ya calculado (nunca la contraseña en claro). */
    passwordHash: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
  };
  /** Rol del dueño en su empresa (por defecto super-admin). */
  rolDueno?: string;
}

export interface EmpresaAprovisionada {
  empresaId: number;
  dbNombre: string;
}

/**
 * Divide un script SQL de MySQL en sentencias, respetando bloques DELIMITER
 * (triggers) y omitiendo comentarios de línea y sentencias DROP/CREATE SCHEMA/USE.
 */
export function dividirScriptSql(script: string): string[] {
  const sentencias: string[] = [];
  let delimitador = ';';
  let actual: string[] = [];

  for (const lineaOriginal of script.replace(/\r\n/g, '\n').split('\n')) {
    const recortada = lineaOriginal.trim();
    if (!recortada || recortada.startsWith('--')) continue;
    const cambio = /^DELIMITER\s+(\S+)$/i.exec(recortada);
    if (cambio) {
      delimitador = cambio[1];
      continue;
    }
    actual.push(lineaOriginal);
    if (recortada.endsWith(delimitador)) {
      const texto = actual.join('\n').trim();
      sentencias.push(texto.slice(0, texto.length - delimitador.length).trim());
      actual = [];
    }
  }
  if (actual.join('').trim()) sentencias.push(actual.join('\n').trim());

  return sentencias.filter((s) => s && !/^(DROP|CREATE)\s+(SCHEMA|DATABASE)\b/i.test(s) && !/^USE\s+/i.test(s));
}

function directorioEsquema(): string {
  return Deno.env.get('ESQUEMA_EMPRESA_DIR') ?? fromFileUrl(new URL('../../../../../Docs/database/', import.meta.url));
}

export class AprovisionadorEmpresas {
  constructor(
    private readonly central: () => CentralDatabase = getCentralDatabase,
    private readonly directorio = new DirectorioCentral(),
  ) {}

  async crear(datos: DatosNuevaEmpresa): Promise<EmpresaAprovisionada> {
    const email = DirectorioCentral.normalizar(datos.dueno.email);
    if (await this.directorio.empresaDe(email) !== null) {
      throw new Error('El correo del dueño ya pertenece a otra empresa.');
    }

    // 1. Registro en la central (el nombre de la base depende del id).
    const [insercion] = await this.central().insert(empresas).values({
      nombre: datos.nombre.trim(),
      nit: datos.nit ?? null,
      db_nombre: `pendiente_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`,
      estado: 'aprovisionando',
    });
    const empresaId = Number(insercion.insertId);
    const dbNombre = `inventa_emp_${empresaId}`;
    await this.central().update(empresas).set({ db_nombre: dbNombre }).where(eq(empresas.id_empresa, empresaId));

    let baseCreada = false;
    try {
      // 2. Base y esquema
      await this.crearBaseConEsquema(dbNombre);
      baseCreada = true;

      // 3. Datos iniciales de la empresa
      const db = obtenerDatabaseDeEmpresa(dbNombre);
      await seedAutenticacion(db);
      await db.insert(sucursales).values({ id_sucursal: 1, nombre: 'Sede principal', direccion: 'Por definir', is_active: 1 });
      const documento = datos.dueno.numeroDocumento?.trim() || `PROP-${empresaId}`;
      await db.insert(empleados).values({
        tipo_documento: datos.dueno.tipoDocumento?.trim() || 'CC',
        numero_documento: documento,
        nombre: datos.dueno.nombre.trim(),
        cargo: 'Propietario',
        sucursal_id: 1,
        fecha_ingreso: new Date().toISOString().slice(0, 10),
      });
      const [empleado] = await db.select({ id: empleados.id_empleado }).from(empleados).where(eq(empleados.numero_documento, documento)).limit(1);
      const [rol] = await db.select({ id: roles.id_rol }).from(roles).where(eq(roles.nombre, datos.rolDueno ?? 'super-admin')).limit(1);
      if (!empleado || !rol) throw new Error('No se pudo crear el empleado o el rol del dueño.');
      await db.insert(usuarios).values({
        empleado_id: empleado.id,
        email,
        password_hash: datos.dueno.passwordHash,
        rol_id: rol.id,
        is_active: 1,
        requiere_2fa: 0,
      });

      // 4. Directorio y activación
      await this.directorio.registrar(email, empresaId);
      await this.central().update(empresas).set({ estado: 'activa' }).where(eq(empresas.id_empresa, empresaId));
      return { empresaId, dbNombre };
    } catch (error) {
      if (baseCreada) await this.ejecutarSinBase(`DROP DATABASE IF EXISTS \`${dbNombre}\``).catch(() => {});
      await this.central().delete(empresas).where(eq(empresas.id_empresa, empresaId)).catch(() => {});
      throw error;
    }
  }

  /** Cambia el rol del dueño y cierra sus sesiones anteriores (tokens emitidos antes de ahora). */
  async ajustarRolDueno(empresaId: number, email: string, rolNombre: string): Promise<void> {
    const [empresa] = await this.central().select({ db: empresas.db_nombre }).from(empresas).where(eq(empresas.id_empresa, empresaId)).limit(1);
    if (!empresa) throw new Error(`La empresa ${empresaId} no existe.`);
    const db = obtenerDatabaseDeEmpresa(empresa.db);
    const [rol] = await db.select({ id: roles.id_rol }).from(roles).where(eq(roles.nombre, rolNombre)).limit(1);
    if (!rol) throw new Error(`El rol ${rolNombre} no existe en la empresa ${empresaId}.`);
    const correo = DirectorioCentral.normalizar(email);
    const [usuario] = await db.select({ id: usuarios.id_usuario, rolId: usuarios.rol_id }).from(usuarios).where(eq(usuarios.email, correo)).limit(1);
    if (!usuario || usuario.rolId === rol.id) return;
    // 1) Cambio de rol: el trigger trg_usuarios_marca_invalidacion_token marca tokens_invalidados_en = NOW().
    await db.update(usuarios).set({ rol_id: rol.id }).where(eq(usuarios.id_usuario, usuario.id));
    // 2) Sin tocar el rol (el trigger no actúa): se lleva la marca a dos segundos antes de ahora.
    //    Así siguen invalidados los tokens viejos, pero no el que se emite enseguida tras el pago
    //    (la regla es iat <= invalidadoEn y MySQL redondea fracciones al guardar DATETIME).
    await db.update(usuarios)
      .set({ tokens_invalidados_en: new Date(Date.now() - 2000) })
      .where(eq(usuarios.id_usuario, usuario.id));
  }

  private async crearBaseConEsquema(dbNombre: string): Promise<void> {
    if (!/^inventa_emp_\d+$/.test(dbNombre)) throw new Error(`Nombre de base inválido: ${dbNombre}`);
    await this.ejecutarSinBase(
      `CREATE DATABASE \`${dbNombre}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    const conexion = await mysql.createConnection({ ...this.configConexion(), database: dbNombre, timezone: 'Z' });
    try {
      await conexion.query("SET time_zone = '+00:00'");
      for (const archivo of ARCHIVOS_ESQUEMA_EMPRESA) {
        const script = await Deno.readTextFile(join(directorioEsquema(), archivo));
        for (const sentencia of dividirScriptSql(script)) await conexion.query(sentencia);
      }
    } finally {
      await conexion.end();
    }
  }

  private async ejecutarSinBase(sql: string): Promise<void> {
    const conexion = await mysql.createConnection(this.configConexion());
    try {
      await conexion.query(sql);
    } finally {
      await conexion.end();
    }
  }

  private configConexion() {
    return {
      host: Deno.env.get('DB_HOST') ?? 'localhost',
      port: Number(Deno.env.get('DB_PORT') ?? 3306),
      user: Deno.env.get('DB_USER') ?? 'inventa_user',
      password: Deno.env.get('DB_PASSWORD') || '',
    };
  }
}
