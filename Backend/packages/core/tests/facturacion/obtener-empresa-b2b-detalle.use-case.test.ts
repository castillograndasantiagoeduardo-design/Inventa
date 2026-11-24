import { assertEquals } from 'jsr:@std/assert@^1';
import { ObtenerEmpresaB2BDetalleUseCase } from '../../src/modules/facturacion/application/use-cases/ObtenerEmpresaB2BDetalleUseCase.ts';
import { Cliente } from '../../src/modules/facturacion/domain/entities/Cliente.ts';
import { CreditoB2B } from '../../src/modules/facturacion/domain/entities/CreditoB2B.ts';
import type { IClienteRepository } from '../../src/modules/facturacion/domain/repositories/IClienteRepository.ts';
import type { ICarteraRepository } from '../../src/modules/facturacion/domain/repositories/ICarteraRepository.ts';
import type { ISucursalOperadorRepository } from '../../src/modules/facturacion/domain/repositories/ISucursalOperadorRepository.ts';

Deno.test('ObtenerEmpresaB2BDetalleUseCase: devuelve error si cliente no existe', async () => {
  const clienteRepo = { findById: async () => null } as unknown as IClienteRepository;
  const carteraRepo = {} as unknown as ICarteraRepository;
  const sucursalRepo: ISucursalOperadorRepository = { obtenerSucursalId: async () => 1 };

  const uc = new ObtenerEmpresaB2BDetalleUseCase(clienteRepo, carteraRepo, sucursalRepo);
  const res = await uc.execute({ clienteId: 'no-existe', usuarioId: 'usr-1' });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CLIENTE_NO_ENCONTRADO');
});

Deno.test('ObtenerEmpresaB2BDetalleUseCase: devuelve detalle completo con créditos y avisos', async () => {
  const cliente = new Cliente(
    'cli-1',
    'NIT',
    '900123456',
    'Ferretería Central SAS',
    'B2B',
    'contacto@ferre.com',
    '3101234567',
    'Cra 5 # 12-30',
    true,
    15_000_000,
    36,
    30,
    5_000_000,
    5_000_000,
    500_000,
    'bajo',
    'aprobado',
    'usr-sa',
    new Date(),
    null,
    null,
    500_000,
    4_000_000,
  );

  const hoy = new Date('2026-11-24T12:00:00.000Z');
  const credito = new CreditoB2B(
    'cred-1',
    'fac-1',
    55,
    'cli-1',
    'Ferretería Central SAS',
    1,
    1_000_000,
    500_000,
    new Date('2026-11-01T12:00:00.000Z'),
    new Date('2026-12-01T12:00:00.000Z'),
    'vigente',
  );

  const clienteRepo = { findById: async () => cliente } as unknown as IClienteRepository;
  const carteraRepo = {
    listarCreditosPorCliente: async () => [credito],
    listarAbonosPorCliente: async () => [],
    listarAvisosPago: async () => ({ items: [], total: 0 }),
    obtenerRentabilidadPorClientes: async () => ({
      'cli-1': {
        clienteId: 'cli-1',
        totalFacturado: 4_000_000,
        totalDevoluciones: 0,
        gananciaBrutaFacturas: 1_000_000,
        gananciaRevertidaDevoluciones: 0,
      },
    }),
  } as unknown as ICarteraRepository;
  const sucursalRepo: ISucursalOperadorRepository = { obtenerSucursalId: async () => 1 };

  const uc = new ObtenerEmpresaB2BDetalleUseCase(clienteRepo, carteraRepo, sucursalRepo);
  const res = await uc.execute({ clienteId: 'cli-1', usuarioId: 'usr-1', fechaReferencia: hoy });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.creditos.length, 1);
  assertEquals(res.value.creditos[0].estado, 'vigente');
  assertEquals(res.value.gananciaGenerada, 1_000_000);
  assertEquals(res.value.antiguedadCarteraDias, 23);
});
