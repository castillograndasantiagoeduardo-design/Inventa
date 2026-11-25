import { assertEquals } from 'jsr:@std/assert@^1';
import { SolicitarCreditoB2BUseCase } from '../../src/modules/facturacion/application/use-cases/SolicitarCreditoB2BUseCase.ts';
import { Cliente } from '../../src/modules/facturacion/domain/entities/Cliente.ts';
import type {
  DatosSolicitudCreditoCliente,
  IClienteRepository,
} from '../../src/modules/facturacion/domain/repositories/IClienteRepository.ts';
import type { ISucursalOperadorRepository } from '../../src/modules/facturacion/domain/repositories/ISucursalOperadorRepository.ts';
import type {
  CrearAlertaAdminData,
  IAlertaAdminRepository,
} from '../../src/modules/administracion/domain/repositories/IAlertaAdminRepository.ts';
import { AlertaAdmin } from '../../src/modules/administracion/domain/entities/AlertaAdmin.ts';
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

class FakeAlertaRepo implements IAlertaAdminRepository {
  public alertas: CrearAlertaAdminData[] = [];
  listar() {
    return Promise.resolve([]);
  }
  findById() {
    return Promise.resolve(null);
  }
  crear(data: CrearAlertaAdminData): Promise<AlertaAdmin> {
    this.alertas.push(data);
    return Promise.resolve(
      new AlertaAdmin(
        'alerta-1',
        data.usuarioId,
        data.sucursalId,
        data.motivo,
        data.prioridad ?? 'normal',
        data.descripcion ?? null,
        'pendiente',
        new Date(),
        null,
        'Sede Principal',
        'vendedor@inventa.local',
        data.destinatarioRol ?? null,
      ),
    );
  }
  actualizarEstado() {
    return Promise.reject(new Error('no usado'));
  }
}

function makeCliente(overrides?: {
  tipoCliente?: 'B2B' | 'B2C';
  creditoHabilitado?: boolean;
  estadoCredito?: 'sin_solicitud' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado';
}): Cliente {
  return new Cliente(
    'cli-b2b-1',
    'NIT',
    '900111222-3',
    'Comercializadora Alfa S.A.S.',
    overrides?.tipoCliente ?? 'B2B',
    'finanzas@alfa.co',
    '3001112233',
    'Calle 10 # 20-30',
    overrides?.creditoHabilitado ?? false,
    null,
    null,
    30,
    0,
    0,
    0,
    null,
    overrides?.estadoCredito ?? 'sin_solicitud',
  );
}

Deno.test('SolicitarCreditoB2BUseCase: evalúa, deja en pendiente_aprobacion, alerta y audita', async () => {
  let clienteGuardado = makeCliente();
  const auditor = new FakeAuditor();
  const alertaRepo = new FakeAlertaRepo();
  const sucursalRepo: ISucursalOperadorRepository = {
    obtenerSucursalId: () => Promise.resolve(1),
  };

  const clienteRepo = {
    findById: (id: string) =>
      Promise.resolve(id === clienteGuardado.id ? clienteGuardado : null),
    solicitarCredito: (id: string, datos: DatosSolicitudCreditoCliente) => {
      clienteGuardado = new Cliente(
        id,
        clienteGuardado.tipoDocumento,
        clienteGuardado.numeroDocumento,
        clienteGuardado.nombreRazonSocial,
        clienteGuardado.tipoCliente,
        clienteGuardado.email,
        clienteGuardado.telefono,
        clienteGuardado.direccion,
        false,
        datos.gananciaNetaMensual,
        datos.antiguedadEmpresaMeses,
        datos.plazoCreditoDias,
        datos.cupoCreditoSugerido,
        0,
        0,
        datos.nivelRiesgoCredito,
        datos.estadoCredito,
        null,
        null,
        null,
        datos.observacionFinanciera,
      );
      return Promise.resolve(clienteGuardado);
    },
  } as unknown as IClienteRepository;

  const uc = new SolicitarCreditoB2BUseCase(clienteRepo, auditor, alertaRepo, sucursalRepo);
  const res = await uc.execute({
    clienteId: 'cli-b2b-1',
    gananciaNetaMensual: 20_000_000,
    antiguedadEmpresaMeses: 24,
    plazoCreditoDias: 30,
    observacionFinanciera: 'Empresa con crecimiento sostenido',
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.cliente.creditoHabilitado, false);
  assertEquals(res.value.cliente.estadoCredito, 'pendiente_aprobacion');
  assertEquals(res.value.cliente.cupoCreditoSugerido, 4_700_000);
  assertEquals(res.value.evaluacionCredito.nivelRiesgo, 'medio');
  assertEquals(res.value.alertaSuperAdminEnviada, true);
  assertEquals(alertaRepo.alertas.length, 1);
  assertEquals(alertaRepo.alertas[0].destinatarioRol, 'super-admin');
  assertEquals(auditor.eventos.length, 1);
  const detalles = auditor.eventos[0].detalles as {
    antes?: Record<string, unknown>;
    despues?: Record<string, unknown>;
  };
  assertEquals(detalles.antes?.estadoCredito, 'sin_solicitud');
  assertEquals(detalles.despues?.estadoCredito, 'pendiente_aprobacion');
});

Deno.test('SolicitarCreditoB2BUseCase: falla si el cliente no existe', async () => {
  const auditor = new FakeAuditor();
  const clienteRepo = {
    findById: () => Promise.resolve(null),
  } as unknown as IClienteRepository;

  const uc = new SolicitarCreditoB2BUseCase(clienteRepo, auditor);
  const res = await uc.execute({
    clienteId: 'inexistente',
    gananciaNetaMensual: 10_000_000,
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CLIENTE_NO_ENCONTRADO');
  assertEquals(auditor.eventos.length, 0);
});

Deno.test('SolicitarCreditoB2BUseCase: rechaza si el cliente ya tiene crédito aprobado', async () => {
  const auditor = new FakeAuditor();
  const clienteAprobado = makeCliente({ estadoCredito: 'aprobado', creditoHabilitado: true });
  const clienteRepo = {
    findById: () => Promise.resolve(clienteAprobado),
    solicitarCredito: () => Promise.reject(new Error('No debe llamarse')),
  } as unknown as IClienteRepository;

  const uc = new SolicitarCreditoB2BUseCase(clienteRepo, auditor);
  const res = await uc.execute({
    clienteId: clienteAprobado.id,
    gananciaNetaMensual: 15_000_000,
    actor: { usuarioId: 'usr-vendedor', ip: '127.0.0.1' },
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'DECISION_CREDITO_INVALIDA');
  assertEquals(auditor.eventos.length, 0);
});
