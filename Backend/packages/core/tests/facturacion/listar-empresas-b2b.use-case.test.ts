import { assertEquals } from 'jsr:@std/assert@^1';
import { ListarEmpresasB2BUseCase } from '../../src/modules/facturacion/application/use-cases/ListarEmpresasB2BUseCase.ts';
import { Cliente } from '../../src/modules/facturacion/domain/entities/Cliente.ts';
import { CreditoB2B } from '../../src/modules/facturacion/domain/entities/CreditoB2B.ts';
import type { IClienteRepository } from '../../src/modules/facturacion/domain/repositories/IClienteRepository.ts';
import type { ICarteraRepository } from '../../src/modules/facturacion/domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../src/modules/facturacion/domain/repositories/ISucursalOperadorRepository.ts';

Deno.test('ListarEmpresasB2BUseCase: consolida cupos, rentabilidad, mora y resumen', async () => {
  const cliente1 = new Cliente(
    'cli-1',
    'NIT',
    '900111222',
    'Distribuidora Norte SAS',
    'B2B',
    'norte@empresa.com',
    '3001112222',
    'Calle 10',
    true,
    20_000_000,
    24,
    30,
    5_000_000,
    5_000_000,
    1_200_000,
    'medio',
    'aprobado',
    'usr-sa',
    new Date(),
    null,
    null,
    1_200_000,
    8_000_000,
  );

  const clienteRepo = {
    buscar: async () => [cliente1],
    buscarPaginado: async () => ({
      items: [cliente1],
      total: 1,
      totalPaginas: 1,
      page: 1,
      limite: 500,
      resumen: { total: 1, b2b: 1, b2c: 0, conCredito: 1, saldoPendienteTotal: 1_200_000 },
    }),
  } as unknown as IClienteRepository;

  const hoy = new Date('2026-11-24T12:00:00.000Z');
  const creditoVencido = new CreditoB2B(
    'cred-1',
    'fac-1',
    1001,
    'cli-1',
    'Distribuidora Norte SAS',
    1,
    1_200_000,
    1_200_000,
    new Date('2026-10-01T12:00:00.000Z'),
    new Date('2026-10-31T12:00:00.000Z'),
    'vigente',
  );

  const carteraRepo = {
    obtenerRentabilidadPorClientes: async () => ({
      'cli-1': {
        clienteId: 'cli-1',
        totalFacturado: 8_000_000,
        totalDevoluciones: 0,
        gananciaBrutaFacturas: 2_000_000,
        gananciaRevertidaDevoluciones: 0,
      },
    }),
    contarAvisosPendientesPorClientes: async () => ({ 'cli-1': 1 }),
    listarCreditos: async () => ({ items: [creditoVencido], total: 1 }),
  } as unknown as ICarteraRepository;

  const sucursalRepo: ISucursalOperadorRepository = {
    obtenerSucursalId: async () => 1,
  };

  const uc = new ListarEmpresasB2BUseCase(clienteRepo, carteraRepo, sucursalRepo);
  const res = await uc.execute({
    filtros: {},
    usuarioId: 'usr-vend',
    fechaReferencia: hoy,
  });

  assertEquals(res.isSuccess, true);
  if (res.isSuccess) {
    const val = res.value;
    assertEquals(val.empresas.length, 1);
    const emp = val.empresas[0];
    assertEquals(emp.gananciaGenerada, 2_000_000);
    assertEquals(emp.rentabilidadSobreCredito, 0.4);
    assertEquals(emp.creditosEnMoraCount, 1);
    assertEquals(emp.montoVencido, 1_200_000);
    assertEquals(emp.diasMoraMax, 24);
    assertEquals(emp.avisosPendientesCount, 1);
    assertEquals(val.resumen.empresasEnMora, 1);
    assertEquals(val.resumen.montoTotalVencido, 1_200_000);
  }
});
