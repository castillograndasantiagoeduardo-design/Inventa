import { assertEquals } from 'jsr:@std/assert@^1';
import { AvisarPagoCreditoUseCase } from '../../src/modules/facturacion/application/use-cases/AvisarPagoCreditoUseCase.ts';
import { CreditoB2B } from '../../src/modules/facturacion/domain/entities/CreditoB2B.ts';
import type { ICarteraRepository } from '../../src/modules/facturacion/domain/repositories/ICarteraRepository.ts';
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

function makeCredito(saldo = 800_000, estado: 'vigente' | 'pagado' = 'vigente'): CreditoB2B {
  return new CreditoB2B(
    'cred-1',
    'fac-1',
    205,
    'cli-1',
    'Industrias Beta S.A.S.',
    1,
    1_000_000,
    saldo,
    new Date('2026-11-01T12:00:00.000Z'),
    new Date('2026-12-01T12:00:00.000Z'),
    estado,
  );
}

Deno.test('AvisarPagoCreditoUseCase: crea aviso pendiente sin alterar saldo y audita', async () => {
  const auditor = new FakeAuditor();
  const credito = makeCredito(800_000);
  const carteraRepo = {
    obtenerCreditoPorId: () => Promise.resolve(credito),
    existeAvisoPendienteConReferencia: () => Promise.resolve(false),
    crearAvisoPago: (params: {
      creditoId: string;
      monto: number;
      referencia: string;
      nota: string | null;
      avisadoPor: string;
    }) =>
      Promise.resolve({
        id: 'aviso-1',
        creditoId: params.creditoId,
        facturaId: credito.facturaId,
        facturaConsecutivo: credito.facturaConsecutivo,
        clienteId: credito.clienteId,
        clienteNombre: credito.clienteNombre,
        sucursalId: credito.sucursalId,
        monto: params.monto,
        saldoActualCredito: credito.saldo,
        referencia: params.referencia,
        nota: params.nota,
        estado: 'pendiente' as const,
        avisadoPor: params.avisadoPor,
        avisadoPorNombre: 'Vendedor B2B',
        fechaAviso: new Date().toISOString(),
        revisadoPor: null,
        revisadoPorNombre: null,
        fechaRevision: null,
        motivoRechazo: null,
      }),
  } as unknown as ICarteraRepository;

  const uc = new AvisarPagoCreditoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    creditoId: 'cred-1',
    monto: 500_000,
    referencia: 'TRF-2026-991',
    nota: 'Transferencia Bancolombia',
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.estado, 'pendiente');
  assertEquals(res.value.monto, 500_000);
  assertEquals(res.value.saldoActualCredito, 800_000);
  assertEquals(auditor.eventos.length, 1);
  assertEquals(auditor.eventos[0].entidad, 'avisos_pago_credito_b2b');
});

Deno.test('AvisarPagoCreditoUseCase: rechaza referencia duplicada pendiente', async () => {
  const auditor = new FakeAuditor();
  const carteraRepo = {
    obtenerCreditoPorId: () => Promise.resolve(makeCredito(800_000)),
    existeAvisoPendienteConReferencia: () => Promise.resolve(true),
    crearAvisoPago: () => Promise.reject(new Error('No debe llamarse')),
  } as unknown as ICarteraRepository;

  const uc = new AvisarPagoCreditoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    creditoId: 'cred-1',
    monto: 500_000,
    referencia: 'TRF-2026-991',
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'AVISO_DUPLICADO_PENDIENTE');
  assertEquals(auditor.eventos.length, 0);
});

Deno.test('AvisarPagoCreditoUseCase: rechaza monto superior al saldo', async () => {
  const auditor = new FakeAuditor();
  const carteraRepo = {
    obtenerCreditoPorId: () => Promise.resolve(makeCredito(200_000)),
  } as unknown as ICarteraRepository;

  const uc = new AvisarPagoCreditoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    creditoId: 'cred-1',
    monto: 300_000,
    referencia: 'TRF-2026-992',
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'MONTO_SUPERA_SALDO');
  assertEquals(auditor.eventos.length, 0);
});
