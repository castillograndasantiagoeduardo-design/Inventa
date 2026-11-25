import { assertEquals } from 'jsr:@std/assert@^1';
import { ListarCarteraUseCase } from '../../src/modules/facturacion/application/use-cases/ListarCarteraUseCase.ts';
import { CreditoB2B } from '../../src/modules/facturacion/domain/entities/CreditoB2B.ts';
import type { ICarteraRepository } from '../../src/modules/facturacion/domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../src/modules/facturacion/domain/repositories/ISucursalOperadorRepository.ts';

Deno.test('ListarCarteraUseCase: filtra por estado derivado en_mora y calcula resumen', async () => {
  const hoy = new Date('2026-11-24T12:00:00.000Z');
  const cVigente = new CreditoB2B(
    'c1', 'f1', 10, 'cli-1', 'Alfa', 1, 1_000_000, 500_000,
    new Date('2026-11-10T12:00:00.000Z'), new Date('2026-12-10T12:00:00.000Z'), 'vigente',
  );
  const cMora = new CreditoB2B(
    'c2', 'f2', 11, 'cli-2', 'Beta', 1, 800_000, 800_000,
    new Date('2026-10-01T12:00:00.000Z'), new Date('2026-10-31T12:00:00.000Z'), 'vigente',
  );
  const cPagado = new CreditoB2B(
    'c3', 'f3', 12, 'cli-1', 'Alfa', 1, 500_000, 0,
    new Date('2026-09-01T12:00:00.000Z'), new Date('2026-10-01T12:00:00.000Z'), 'pagado',
  );

  const carteraRepo = {
    listarCreditos: async () => ({ items: [cVigente, cMora, cPagado], total: 3 }),
  } as unknown as ICarteraRepository;
  const sucursalRepo: ISucursalOperadorRepository = { obtenerSucursalId: async () => 1 };

  const uc = new ListarCarteraUseCase(carteraRepo, sucursalRepo);
  const res = await uc.execute({
    filtros: { estado: 'en_mora', pagina: 1, limite: 20 },
    usuarioId: 'usr-1',
    fechaReferencia: hoy,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.items.length, 1);
  assertEquals(res.value.items[0].id, 'c2');
  assertEquals(res.value.items[0].diasMora, 24);
  assertEquals(res.value.resumen.vigentes, 2);
  assertEquals(res.value.resumen.pagados, 1);
  assertEquals(res.value.resumen.enMora, 1);
  assertEquals(res.value.resumen.saldoTotal, 1_300_000);
});
