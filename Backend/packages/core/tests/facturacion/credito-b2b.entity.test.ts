import { assertEquals } from 'jsr:@std/assert@^1';
import { CreditoB2B } from '../../src/modules/facturacion/domain/entities/CreditoB2B.ts';

Deno.test('CreditoB2B: estado vigente cuando saldo > 0 y fecha vencimiento futura', () => {
  const emision = new Date('2026-10-01T10:00:00.000Z');
  const vencimiento = new Date('2026-10-31T10:00:00.000Z');
  const hoy = new Date('2026-10-15T10:00:00.000Z');

  const credito = new CreditoB2B(
    'cred-1',
    'fac-1',
    101,
    'cli-1',
    'Empresa Alfa SAS',
    1,
    1_000_000,
    400_000,
    emision,
    vencimiento,
    'vigente',
    emision,
  );

  assertEquals(credito.estadoDerivado(hoy), 'vigente');
  assertEquals(credito.diasMora(hoy), 0);
  assertEquals(credito.diasTranscurridos(hoy), 14);
  assertEquals(credito.totalAbonado, 600_000);
});

Deno.test('CreditoB2B: estado derivado en_mora y días de mora cuando vence', () => {
  const emision = new Date('2026-10-01T10:00:00.000Z');
  const vencimiento = new Date('2026-10-31T10:00:00.000Z');
  const hoy = new Date('2026-11-10T10:00:00.000Z');

  const credito = new CreditoB2B(
    'cred-2',
    'fac-2',
    102,
    'cli-1',
    'Empresa Alfa SAS',
    1,
    500_000,
    500_000,
    emision,
    vencimiento,
    'vigente',
    emision,
  );

  assertEquals(credito.estaEnMora(hoy), true);
  assertEquals(credito.estadoDerivado(hoy), 'en_mora');
  assertEquals(credito.diasMora(hoy), 10);
});

Deno.test('CreditoB2B: estado pagado nunca entra en mora aunque la fecha haya pasado', () => {
  const emision = new Date('2026-09-01T10:00:00.000Z');
  const vencimiento = new Date('2026-10-01T10:00:00.000Z');
  const hoy = new Date('2026-11-10T10:00:00.000Z');

  const credito = new CreditoB2B(
    'cred-3',
    'fac-3',
    103,
    'cli-1',
    'Empresa Alfa SAS',
    1,
    500_000,
    0,
    emision,
    vencimiento,
    'pagado',
    emision,
  );

  assertEquals(credito.estaPagado, true);
  assertEquals(credito.estaEnMora(hoy), false);
  assertEquals(credito.estadoDerivado(hoy), 'pagado');
  assertEquals(credito.diasMora(hoy), 0);
});
