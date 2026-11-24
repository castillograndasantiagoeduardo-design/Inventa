/**
 * central.seed.ts — Registra la base actual (DB_NAME) como empresa n.º 1 en la base
 * central y sincroniza el directorio de correos con sus usuarios.
 *
 * Requisito: haber ejecutado Docs/database/central/INVENTA_CENTRAL_BD.sql.
 * Idempotente: se puede ejecutar varias veces (deno task seed:central).
 */

import { sql } from 'drizzle-orm';
import { getDatabase, closeDatabase } from '../client.ts';
import { usuarios } from '../schema/autenticacion.schema.ts';
import { cerrarBasesEmpresa, getCentralDatabase, nombreDbPorDefecto } from '../tenancy/bases-empresa.ts';
import { directorioUsuarios, empresas } from '../tenancy/central.schema.ts';

export async function sembrarCentral(): Promise<void> {
  const central = getCentralDatabase();
  const empresaId = Number(Deno.env.get('EMPRESA_POR_DEFECTO_ID') ?? 1);
  const dbNombre = nombreDbPorDefecto();
  const nombre = Deno.env.get('EMPRESA_POR_DEFECTO_NOMBRE') ?? 'Empresa principal';

  console.log(`\n🏢 Registrando empresa n.º ${empresaId} (${nombre}) → base "${dbNombre}"...`);
  await central
    .insert(empresas)
    .values({ id_empresa: empresaId, nombre, db_nombre: dbNombre, estado: 'activa' })
    .onDuplicateKeyUpdate({ set: { db_nombre: dbNombre, estado: 'activa' } });

  const filas = await getDatabase().select({ email: usuarios.email }).from(usuarios);
  const correos = [...new Set(filas.map((f) => f.email.trim().toLowerCase()))];
  if (correos.length > 0) {
    await central
      .insert(directorioUsuarios)
      .values(correos.map((email) => ({ email, empresa_id: empresaId })))
      .onDuplicateKeyUpdate({ set: { empresa_id: sql`empresa_id` } });
  }
  console.log(`   ✔ Directorio: ${correos.length} correos de la empresa n.º ${empresaId}`);
}

if (import.meta.main) {
  try {
    await sembrarCentral();
    console.log('\n✅ Base central lista.');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ No se pudo sembrar la base central: ${msg}`);
    console.error('   ¿Ejecutaste Docs/database/central/INVENTA_CENTRAL_BD.sql?');
    Deno.exitCode = 1;
  } finally {
    await cerrarBasesEmpresa();
    await closeDatabase();
  }
}
