import { assertEquals } from 'jsr:@std/assert@^1';
import { RegistrarAbonoCreditoUseCase } from '../../src/modules/facturacion/application/use-cases/RegistrarAbonoCreditoUseCase.ts';
import { CreditoB2B } from '../../src/modules/facturacion/domain/entities/CreditoB2B.ts';
import type {
  ICarteraRepository,
  RegistrarAbonoAtomicoParams,
} from '../../src/modules/facturacion/domain/repositories/ICarteraRepository.ts';
import type {
  EventoAuditoria,
  IAuditor,
} from '../../src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';

class FakeAuditor implements IAuditor {
  public eventos: EventoAuditoria[] = [];
  registrar(evento: EventoAuditoria): Promise<void> {
    this.eventos.push(evento);
    return Promise.resolve();
  }
}

function makeCredito(saldo = 1_000_000, estado: 'vigente' | 'pagado' = 'vigente'): CreditoB2B {
  return new CreditoB2B(
    'cred-1',
    'fac-1',
    101,
    'cli-1',
    'Ferretería Central S.A.S.',
    1,
    1_000_000,
    saldo,
    new Date('2026-11-01T12:00:00.000Z'),
    new Date('2026-12-01T12:00:00.000Z'),
    estado,
  );
}

Deno.test('RegistrarAbonoCreditoUseCase: aplica abono parcial atómico, libera cupo y audita', async () => {
  const auditor = new FakeAuditor();
  const creditoInicial = makeCredito(1_000_000);
  let llamados = 0;

  const carteraRepo = {
    obtenerCreditoPorId: () => Promise.resolve(creditoInicial),
    registrarAbonoAtomico: (params: RegistrarAbonoAtomicoParams) => {
      llamados++;
      const nuevoSaldo = creditoInicial.saldo - params.monto;
      const actualizado = new CreditoB2B(
        creditoInicial.id,
        creditoInicial.facturaId,
        creditoInicial.facturaConsecutivo,
        creditoInicial.clienteId,
        creditoInicial.clienteNombre,
        creditoInicial.sucursalId,
        creditoInicial.monto,
        nuevoSaldo,
        creditoInicial.fechaEmision,
        creditoInicial.fechaVencimiento,
        nuevoSaldo <= 0 ? 'pagado' : 'vigente',
      );
      return Promise.resolve({
        abono: {
          id: 'abono-1',
          creditoId: params.creditoId,
          monto: params.monto,
          fecha: new Date().toISOString(),
          registradoPor: params.registradoPor,
          avisoId: params.avisoId ?? null,
        },
        creditoActualizado: actualizado,
        saldoClienteAntes: 1_000_000,
        saldoClienteDespues: 600_000,
        cupoUtilizadoAntes: 1_000_000,
        cupoUtilizadoDespues: 600_000,
      });
    },
  } as unknown as ICarteraRepository;

  const uc = new RegistrarAbonoCreditoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    creditoId: 'cred-1',
    monto: 400_000,
    actor: { usuarioId: 'usr-admin', ip: '127.0.0.1' },
  });

  assertEquals(res.isSuccess, true);
  assertEquals(llamados, 1);
  assertEquals(res.value.abono.monto, 400_000);
  assertEquals(res.value.credito.saldo, 600_000);
  assertEquals(res.value.credito.estado, 'vigente');
  assertEquals(auditor.eventos.length, 1);
  assertEquals(auditor.eventos[0].entidad, 'abonos_credito_b2b');
});

Deno.test('RegistrarAbonoCreditoUseCase: rechaza si el monto supera el saldo pendiente', async () => {
  const auditor = new FakeAuditor();
  const carteraRepo = {
    obtenerCreditoPorId: () => Promise.resolve(makeCredito(300_000)),
    registrarAbonoAtomico: () => Promise.reject(new Error('No debe llamarse')),
  } as unknown as ICarteraRepository;

  const uc = new RegistrarAbonoCreditoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    creditoId: 'cred-1',
    monto: 350_000,
    actor: { usuarioId: 'usr-admin', ip: '127.0.0.1' },
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'MONTO_SUPERA_SALDO');
  assertEquals(auditor.eventos.length, 0);
});

Deno.test('RegistrarAbonoCreditoUseCase: rechaza si el crédito ya está pagado', async () => {
  const auditor = new FakeAuditor();
  const carteraRepo = {
    obtenerCreditoPorId: () => Promise.resolve(makeCredito(0, 'pagado')),
  } as unknown as ICarteraRepository;

  const uc = new RegistrarAbonoCreditoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    creditoId: 'cred-1',
    monto: 100_000,
    actor: { usuarioId: 'usr-admin', ip: '127.0.0.1' },
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CREDITO_YA_PAGADO');
  assertEquals(auditor.eventos.length, 0);
});
