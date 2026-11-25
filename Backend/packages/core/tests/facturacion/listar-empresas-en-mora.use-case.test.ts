import { assertEquals } from 'jsr:@std/assert@^1';
import { ListarEmpresasEnMoraUseCase } from '../../src/modules/facturacion/application/use-cases/ListarEmpresasEnMoraUseCase.ts';
import { Cliente } from '../../src/modules/facturacion/domain/entities/Cliente.ts';
import { CreditoB2B } from '../../src/modules/facturacion/domain/entities/CreditoB2B.ts';
import type { IClienteRepository } from '../../src/modules/facturacion/domain/repositories/IClienteRepository.ts';
import type { ICarteraRepository } from '../../src/modules/facturacion/domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../src/modules/facturacion/domain/repositories/ISucursalOperadorRepository.ts';

Deno.test('ListarEmpresasEnMoraUseCase: agrupa empresas en mora y ordena por mayor atraso', async () => {
  const hoy = new Date('2026-11-24T12:00:00.000Z');
  const c1 = new CreditoB2B(
    'c1', 'f1', 10, 'cli-1', 'Empresa Uno', 1, 1_000_000, 400_000,
    new Date('2026-10-10T12:00:00.000Z'), new Date('2026-11-10T12:00:00.000Z'), 'vigente',
  );
  const c2 = new CreditoB2B(
    'c2', 'f2', 11, 'cli-2', 'Empresa Dos', 1, 2_000_000, 1_500_000,
    new Date('2026-09-25T12:00:00.000Z'), new Date('2026-10-25T12:00:00.000Z'), 'vigente',
  );
  const cVigente = new CreditoB2B(
    'c3', 'f3', 12, 'cli-3', 'Empresa Tres', 1, 500_000, 500_000,
    new Date('2026-11-15T12:00:00.000Z'), new Date('2026-12-15T12:00:00.000Z'), 'vigente',
  );

  const clienteRepo = {
    findById: async (id: string) =>
      new Cliente(id, 'NIT', `900-${id}`, `Razón ${id}`, 'B2B', null, '3000000000', 'Dir', true),
  } as unknown as IClienteRepository;
  const carteraRepo = {
    listarCreditos: async () => ({ items: [c1, c2, cVigente], total: 3 }),
  } as unknown as ICarteraRepository;
  const sucursalRepo: ISucursalOperadorRepository = { obtenerSucursalId: async () => 1 };

  const uc = new ListarEmpresasEnMoraUseCase(clienteRepo, carteraRepo, sucursalRepo);
  const res = await uc.execute({ usuarioId: 'usr-1', fechaReferencia: hoy });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.length, 2);
  assertEquals(res.value[0].clienteId, 'cli-2');
  assertEquals(res.value[0].diasMoraMax, 30);
  assertEquals(res.value[1].clienteId, 'cli-1');
  assertEquals(res.value[1].diasMoraMax, 14);
});
