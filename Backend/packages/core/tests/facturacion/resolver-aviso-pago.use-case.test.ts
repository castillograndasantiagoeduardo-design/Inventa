import { assertEquals } from 'jsr:@std/assert@^1';
import { ResolverAvisoPagoUseCase } from '../../src/modules/facturacion/application/use-cases/ResolverAvisoPagoUseCase.ts';
import { CreditoB2B } from '../../src/modules/facturacion/domain/entities/CreditoB2B.ts';
import type { AvisoPagoCreditoDto } from '@inventa/contracts';
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

function makeAviso(estado: 'pendiente' | 'confirmado' | 'rechazado' = 'pendiente'): AvisoPagoCreditoDto {
  return {
    id: 'aviso-1',
    creditoId: 'cred-1',
    facturaId: 'fac-1',
    facturaConsecutivo: 301,
    clienteId: 'cli-1',
    clienteNombre: 'Distribuidora Sur SAS',
    sucursalId: 1,
    monto: 600_000,
    saldoActualCredito: 1_000_000,
    referencia: 'TRF-8821',
    nota: 'Pago parcial',
    estado,
    avisadoPor: 'usr-vendedor',
    avisadoPorNombre: 'Carlos Vendedor',
    fechaAviso: '2026-11-24T10:00:00.000Z',
    revisadoPor: null,
    revisadoPorNombre: null,
    fechaRevision: null,
    motivoRechazo: null,
  };
}

function makeCredito(saldo = 1_000_000): CreditoB2B {
  return new CreditoB2B(
    'cred-1',
    'fac-1',
    301,
    'cli-1',
    'Distribuidora Sur SAS',
    1,
    1_000_000,
    saldo,
    new Date('2026-11-01T12:00:00.000Z'),
    new Date('2026-12-01T12:00:00.000Z'),
    'vigente',
  );
}

Deno.test('ResolverAvisoPagoUseCase: confirmar ejecuta abono atómico con avisoId y audita', async () => {
  const auditor = new FakeAuditor();
  let avisoActual = makeAviso('pendiente');
  const credito = makeCredito(1_000_000);

  const carteraRepo = {
    obtenerAvisoPorId: () => Promise.resolve(avisoActual),
    obtenerCreditoPorId: () => Promise.resolve(credito),
    registrarAbonoAtomico: (params: RegistrarAbonoAtomicoParams) => {
      avisoActual = {
        ...avisoActual,
        estado: 'confirmado',
        revisadoPor: params.registradoPor,
        fechaRevision: new Date().toISOString(),
        saldoActualCredito: 400_000,
      };
      const creditoAct = makeCredito(400_000);
      return Promise.resolve({
        abono: {
          id: 'abono-99',
          creditoId: params.creditoId,
          monto: params.monto,
          fecha: new Date().toISOString(),
          registradoPor: params.registradoPor,
          avisoId: params.avisoId ?? null,
        },
        creditoActualizado: creditoAct,
        saldoClienteAntes: 1_000_000,
        saldoClienteDespues: 400_000,
        cupoUtilizadoAntes: 1_000_000,
        cupoUtilizadoDespues: 400_000,
      });
    },
  } as unknown as ICarteraRepository;

  const uc = new ResolverAvisoPagoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    avisoId: 'aviso-1',
    decision: 'confirmar',
    actor: { usuarioId: 'usr-admin', ip: '127.0.0.1' },
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.decision, 'confirmar');
  assertEquals(res.value.aviso.estado, 'confirmado');
  assertEquals(res.value.abono?.avisoId, 'aviso-1');
  assertEquals(res.value.credito?.saldo, 400_000);
  assertEquals(auditor.eventos.length, 1);
});

Deno.test('ResolverAvisoPagoUseCase: rechazar sin motivo suficiente falla con MOTIVO_RECHAZO_REQUERIDO', async () => {
  const auditor = new FakeAuditor();
  const carteraRepo = {
    obtenerAvisoPorId: () => Promise.resolve(makeAviso('pendiente')),
  } as unknown as ICarteraRepository;

  const uc = new ResolverAvisoPagoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    avisoId: 'aviso-1',
    decision: 'rechazar',
    motivoRechazo: 'No',
    actor: { usuarioId: 'usr-admin', ip: '127.0.0.1' },
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'MOTIVO_RECHAZO_REQUERIDO');
  assertEquals(auditor.eventos.length, 0);
});

Deno.test('ResolverAvisoPagoUseCase: rechazar con motivo marca rechazado sin tocar saldos', async () => {
  const auditor = new FakeAuditor();
  const avisoInicial = makeAviso('pendiente');
  const carteraRepo = {
    obtenerAvisoPorId: () => Promise.resolve(avisoInicial),
    rechazarAvisoPago: (p: { avisoId: string; revisadoPor: string; motivoRechazo: string }) =>
      Promise.resolve({
        ...avisoInicial,
        estado: 'rechazado' as const,
        revisadoPor: p.revisadoPor,
        fechaRevision: new Date().toISOString(),
        motivoRechazo: p.motivoRechazo,
      }),
    registrarAbonoAtomico: () => Promise.reject(new Error('No debe llamarse')),
  } as unknown as ICarteraRepository;

  const uc = new ResolverAvisoPagoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    avisoId: 'aviso-1',
    decision: 'rechazar',
    motivoRechazo: 'Referencia bancaria no aparece en extracto',
    actor: { usuarioId: 'usr-admin', ip: '127.0.0.1' },
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.aviso.estado, 'rechazado');
  assertEquals(auditor.eventos.length, 1);
});

Deno.test('ResolverAvisoPagoUseCase: impide resolver aviso ya resuelto', async () => {
  const auditor = new FakeAuditor();
  const carteraRepo = {
    obtenerAvisoPorId: () => Promise.resolve(makeAviso('confirmado')),
  } as unknown as ICarteraRepository;

  const uc = new ResolverAvisoPagoUseCase(carteraRepo, auditor);
  const res = await uc.execute({
    avisoId: 'aviso-1',
    decision: 'confirmar',
    actor: { usuarioId: 'usr-admin', ip: '127.0.0.1' },
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'AVISO_YA_RESUELTO');
});
