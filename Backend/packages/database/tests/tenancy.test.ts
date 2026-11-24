import { assertEquals, assertNotStrictEquals, assertStrictEquals, assertThrows } from 'jsr:@std/assert@^1';
import {
  cerrarBasesEmpresa,
  crearDatabaseEnrutada,
  ejecutarConEmpresa,
  nombreDbPorDefecto,
  obtenerContextoEmpresa,
  obtenerDatabaseDeEmpresa,
} from '../src/tenancy/index.ts';

Deno.test('Multiempresa: el contexto se conserva a través de await', async () => {
  assertEquals(obtenerContextoEmpresa(), undefined);
  await ejecutarConEmpresa({ empresaId: 7, dbNombre: 'inventa_emp_7' }, async () => {
    await new Promise((r) => setTimeout(r, 5));
    assertEquals(obtenerContextoEmpresa()?.empresaId, 7);
  });
  assertEquals(obtenerContextoEmpresa(), undefined);
});

Deno.test('Multiempresa: el db enrutado usa la base de la empresa del contexto', async () => {
  const enrutada = crearDatabaseEnrutada() as unknown as Record<string, unknown>;
  const clienteA = ejecutarConEmpresa({ empresaId: 2, dbNombre: 'inventa_emp_a' }, () => enrutada['$client']);
  const clienteB = ejecutarConEmpresa({ empresaId: 3, dbNombre: 'inventa_emp_b' }, () => enrutada['$client']);
  assertStrictEquals(clienteA, (obtenerDatabaseDeEmpresa('inventa_emp_a') as unknown as Record<string, unknown>)['$client']);
  assertNotStrictEquals(clienteA, clienteB);
  assertStrictEquals(obtenerDatabaseDeEmpresa(nombreDbPorDefecto()), obtenerDatabaseDeEmpresa(nombreDbPorDefecto()));
  await cerrarBasesEmpresa();
});

Deno.test('Multiempresa: rechaza nombres de base inválidos', () => {
  assertThrows(() => obtenerDatabaseDeEmpresa('inventa; DROP DATABASE x'));
});

// ─── Fase 2: aprovisionamiento y tope del plan ───────────────────────────────
import { conTopePlan, conDirectorioCentral, dividirScriptSql, TopePermisosPlan, DirectorioCentral } from '../src/tenancy/index.ts';
import type { IGestionUsuarioRepository, IRolRepository } from '@inventa/core';

Deno.test('Aprovisionador: divide el script respetando DELIMITER y omite esquema/USE/comentarios', () => {
  const script = [
    '-- comentario;',
    'DROP SCHEMA IF EXISTS x;',
    'CREATE SCHEMA x DEFAULT CHARACTER SET utf8mb4;',
    'USE x;',
    'CREATE TABLE a (id INT);',
    'DELIMITER $$',
    'CREATE TRIGGER t BEFORE INSERT ON a FOR EACH ROW',
    'BEGIN',
    '  SET NEW.id = 1;',
    'END$$',
    'DELIMITER ;',
    'INSERT INTO a VALUES (1);',
  ].join('\n');
  const sentencias = dividirScriptSql(script);
  assertEquals(sentencias.length, 3);
  assertEquals(sentencias[0], 'CREATE TABLE a (id INT)');
  assertEquals(sentencias[1].startsWith('CREATE TRIGGER t'), true);
  assertEquals(sentencias[1].includes('SET NEW.id = 1;'), true);
});

Deno.test('Aprovisionador: el esquema real no apunta a ninguna base y conserva todos los triggers', async () => {
  const script = await Deno.readTextFile(new URL('../../../../Docs/database/INVENTA_FULL_BD.sql', import.meta.url));
  const sentencias = dividirScriptSql(script);
  assertEquals(sentencias.some((s) => /^(USE|DROP\s+SCHEMA|CREATE\s+SCHEMA)\b/i.test(s)), false);
  const triggersEnScript = (script.match(/^CREATE TRIGGER/gm) ?? []).length;
  assertEquals(sentencias.filter((s) => /^CREATE TRIGGER/i.test(s)).length, triggersEnScript);
});

class TopeFalso extends TopePermisosPlan {
  constructor(private readonly mapa: Record<number, string[] | null>) {
    super(() => { throw new Error('no se usa'); });
  }
  override permisosPermitidos(empresaId: number | undefined) {
    const v = empresaId === undefined ? null : this.mapa[empresaId] ?? null;
    return Promise.resolve(v === null ? null : new Set(v));
  }
}

Deno.test('Tope del plan: permisos efectivos = rol ∩ plan según la empresa del contexto', async () => {
  const base: IRolRepository = { obtenerPermisosDeRol: () => Promise.resolve(['inventario:leer', 'facturacion:facturar', 'administracion:gestionar-sucursales']) };
  const repo = conTopePlan(base, new TopeFalso({ 1: null, 3: ['inventario:leer', 'facturacion:facturar'], 4: [] }));
  const en = (empresaId: number) => ejecutarConEmpresa({ empresaId, dbNombre: 'x' }, () => repo.obtenerPermisosDeRol(1));
  assertEquals((await en(1)).length, 3);
  assertEquals(await en(3), ['inventario:leer', 'facturacion:facturar']);
  assertEquals(await en(4), []);
});

Deno.test('Directorio: rechaza correos de otra empresa y registra los usuarios nuevos', async () => {
  const registrados: Array<[string, number]> = [];
  const directorio = {
    correoOcupadoFueraDe: (email: string, empresaId: number) => Promise.resolve(email === 'otro@x.co' && empresaId !== 9),
    registrar: (email: string, empresaId: number) => { registrados.push([email, empresaId]); return Promise.resolve(); },
  } as unknown as DirectorioCentral;
  const base = {
    existeEmail: () => Promise.resolve(false),
    crear: (d: { email: string }) => Promise.resolve({ email: d.email }),
  } as unknown as IGestionUsuarioRepository;
  const repo = conDirectorioCentral(base, directorio);
  await ejecutarConEmpresa({ empresaId: 5, dbNombre: 'x' }, async () => {
    assertEquals(await repo.existeEmail('otro@x.co'), true);
    assertEquals(await repo.existeEmail('libre@x.co'), false);
    await repo.crear({ email: 'nuevo@x.co' } as Parameters<IGestionUsuarioRepository['crear']>[0]);
  });
  assertEquals(registrados, [['nuevo@x.co', 5]]);
});
