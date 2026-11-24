import { assertEquals } from 'jsr:@std/assert@1';
import { evaluarTarjetaSimulada } from '../../src/pagos/pasarela-simulada.ts';

const ahora = new Date('2026-11-24T00:00:00Z');
const base = { titular: 'Laura C', vencimiento: '12/29', cvv: '123' };

Deno.test('Pasarela simulada: aprueba 4242…, rechaza 4000…0002', () => {
  assertEquals(evaluarTarjetaSimulada({ ...base, numero: '4242 4242 4242 4242' }, ahora), { ok: true, estado: 'aprobado' });
  const r = evaluarTarjetaSimulada({ ...base, numero: '4000-0000-0000-0002' }, ahora);
  assertEquals(r.ok && r.estado, 'rechazado');
});

Deno.test('Pasarela simulada: valida Luhn, vencimiento y CVV', () => {
  assertEquals(evaluarTarjetaSimulada({ ...base, numero: '4242424242424241' }, ahora).ok, false);
  assertEquals(evaluarTarjetaSimulada({ ...base, numero: '4242424242424242', vencimiento: '10/26' }, ahora).ok, false);
  assertEquals(evaluarTarjetaSimulada({ ...base, numero: '4242424242424242', vencimiento: '13/29' }, ahora).ok, false);
  assertEquals(evaluarTarjetaSimulada({ ...base, numero: '4242424242424242', cvv: '12' }, ahora).ok, false);
  assertEquals(evaluarTarjetaSimulada({ ...base, numero: '4242424242424242', vencimiento: '11/26' }, ahora).ok, true);
});
