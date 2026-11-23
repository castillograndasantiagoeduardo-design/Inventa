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
