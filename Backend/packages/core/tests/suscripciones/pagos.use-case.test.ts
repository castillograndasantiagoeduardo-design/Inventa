import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  ConfirmarPagoUseCase,
  Cuenta,
  EstadoPago,
  IAprovisionadorEmpresas,
  ICuentaRepository,
  IniciarPagoUseCase,
  IPagoRepository,
  IPasarelaPagos,
  IPlanRepository,
  ISuscripcionRepository,
  Pago,
  Plan,
} from '../../mod.ts';

const DIA = 864e5;
const plan = (id: string, precio: number): Plan => ({
  id, nombre: id, etiqueta: '', descripcion: '', precioCentavos: precio, diasVigencia: 30, maxSucursales: null, orden: 0, permisos: [],
});

function escenario(empresaInicial: number | null = null) {
  const cuenta: Cuenta = { id: 'c1', email: 'ana@x.co', nombre: 'Ana', passwordHash: 'h', empresaId: empresaInicial, colorPrincipal: null, logoVersion: null, creadaEn: new Date() };
  const cuentas: ICuentaRepository = {
    buscarPorEmail: () => Promise.resolve(cuenta),
    buscarPorId: (id) => Promise.resolve(id === 'c1' ? cuenta : null),
    correoOcupado: () => Promise.resolve(false),
    crear: () => Promise.reject(new Error('no')),
    asignarEmpresa: (_id, empresaId) => { cuenta.empresaId = empresaId; return Promise.resolve(); },
    actualizarLogo: () => Promise.resolve(),
    obtenerLogo: () => Promise.resolve(null),
  };
  const planes: IPlanRepository = {
    listarActivos: () => Promise.resolve([]),
    buscar: (id) => Promise.resolve(({ tienda: plan('tienda', 8900000), empresario: plan('empresario', 15900000) } as Record<string, Plan>)[id] ?? null),
  };
  const pagos: Pago[] = [];
  const repoPagos: IPagoRepository = {
    crear: (d) => {
      const p: Pago = { id: `p${pagos.length + 1}`, moneda: 'COP', estado: 'pendiente', transaccionExterna: null, creadoEn: new Date(), detalle: d.detalle ?? null, ...d };
      pagos.push(p);
      return Promise.resolve(p);
    },
    agregarDetalle: () => Promise.resolve(),
    buscarPorReferencia: (r) => Promise.resolve(pagos.find((p) => p.referencia === r) ?? null),
    marcarSiPendiente: (id, estado, tx) => {
      const p = pagos.find((x) => x.id === id);
      if (!p || p.estado !== 'pendiente') return Promise.resolve(false);
      p.estado = estado;
      p.transaccionExterna = tx;
      return Promise.resolve(true);
    },
  };
  const periodos: Array<{ empresaId: number; planId: string; pagoId: string; iniciaEn: Date; venceEn: Date }> = [];
  const suscripciones: ISuscripcionRepository = {
    vigenteDeEmpresa: (empresaId, ahora = new Date()) => {
      const v = periodos.filter((s) => s.empresaId === empresaId && s.iniciaEn <= ahora && s.venceEn > ahora).sort((a, b) => +b.venceEn - +a.venceEn)[0];
      return Promise.resolve(v ? { empresaId, planId: v.planId, iniciaEn: v.iniciaEn, venceEn: v.venceEn } : null);
    },
    registrar: (d) => { if (!periodos.some((p) => p.pagoId === d.pagoId)) periodos.push(d); return Promise.resolve(); },
    buscarPorPago: (pagoId) => Promise.resolve(periodos.find((p) => p.pagoId === pagoId) ?? null),
  };
  const resultados = new Map<string, EstadoPago>();
  const pasarela: IPasarelaPagos = {
    nombre: 'prueba',
    urlDePago: (p) => `/pagar/${p.referencia}`,
    consultar: (ref) => Promise.resolve({ estado: resultados.get(ref) ?? 'pendiente', transaccionId: resultados.has(ref) ? `tx-${ref}` : null }),
  };
  let empresasCreadas = 0;
  const roles: Array<[number, string]> = [];
  const aprovisionador: IAprovisionadorEmpresas = {
    crear: (d) => { empresasCreadas++; roles.push([40 + empresasCreadas, d.rolDueno]); return Promise.resolve({ empresaId: 40 + empresasCreadas }); },
    ajustarRolDueno: (empresaId, _email, rol) => { roles.push([empresaId, rol]); return Promise.resolve(); },
    invalidarCaches: () => {},
  };
  return {
    cuenta, pagos, periodos, resultados, roles, empresasCreadas: () => empresasCreadas,
    iniciar: new IniciarPagoUseCase(cuentas, planes, repoPagos, pasarela),
    confirmar: new ConfirmarPagoUseCase(cuentas, planes, repoPagos, suscripciones, pasarela, aprovisionador),
  };
}

Deno.test('IniciarPago: el monto sale del catálogo y la primera compra exige nombre de empresa', async () => {
  const e = escenario();
  const sinNombre = await e.iniciar.execute({ cuentaId: 'c1', planId: 'tienda' });
  assertEquals(sinNombre.isFailure && sinNombre.error.code, 'DATOS_EMPRESA_REQUERIDOS');
  const ok = await e.iniciar.execute({ cuentaId: 'c1', planId: 'tienda', nombreEmpresa: 'Ferretería Ana' });
  assert(ok.isSuccess);
  assertEquals(ok.value.montoCentavos, 8900000);
  assertEquals(e.pagos[0].detalle, { nombreEmpresa: 'Ferretería Ana', nit: null });
  const inexistente = await e.iniciar.execute({ cuentaId: 'c1', planId: 'oro', nombreEmpresa: 'X Ana' });
  assertEquals(inexistente.isFailure && inexistente.error.code, 'PLAN_NO_ENCONTRADO');
});

Deno.test('ConfirmarPago: rechazado no activa; aprobado crea la empresa una sola vez', async () => {
  const e = escenario();
  const ini = await e.iniciar.execute({ cuentaId: 'c1', planId: 'tienda', nombreEmpresa: 'Ferretería Ana' });
  const ref = ini.isSuccess ? ini.value.referencia : '';

  const pendiente = await e.confirmar.execute({ cuentaId: 'c1', referencia: ref });
  assertEquals(pendiente.isSuccess && pendiente.value.estado, 'pendiente');

  e.resultados.set(ref, 'aprobado');
  const ahora = new Date('2026-11-24T00:00:00Z');
  const r1 = await e.confirmar.execute({ cuentaId: 'c1', referencia: ref, ahora });
  const r2 = await e.confirmar.execute({ cuentaId: 'c1', referencia: ref, ahora });
  assert(r1.isSuccess && r2.isSuccess);
  assertEquals(r1.value.empresaId, 41);
  assertEquals(e.empresasCreadas(), 1);
  assertEquals(e.periodos.length, 1);
  assertEquals(r2.value.venceEn, new Date(ahora.getTime() + 30 * DIA));

  const ajeno = await e.confirmar.execute({ cuentaId: 'otra', referencia: ref });
  assertEquals(ajeno.isFailure && ajeno.error.code, 'PAGO_NO_ENCONTRADO');
});

Deno.test('ConfirmarPago: renovar el mismo plan suma al final; cambiar de plan empieza ya', async () => {
  const e = escenario(7);
  const ahora = new Date('2026-11-24T00:00:00Z');
  const pagar = async (planId: string) => {
    const ini = await e.iniciar.execute({ cuentaId: 'c1', planId });
    const ref = ini.isSuccess ? ini.value.referencia : '';
    e.resultados.set(ref, 'aprobado');
    const r = await e.confirmar.execute({ cuentaId: 'c1', referencia: ref, ahora });
    return r.isSuccess ? r.value.venceEn : null;
  };
  assertEquals(await pagar('tienda'), new Date(ahora.getTime() + 30 * DIA));
  assertEquals(await pagar('tienda'), new Date(ahora.getTime() + 60 * DIA));
  assertEquals(await pagar('empresario'), new Date(ahora.getTime() + 30 * DIA));
  assertEquals(e.empresasCreadas(), 0);
  // El rol del dueño sigue al plan: Tienda → admin-sucursal; Empresario → super-admin.
  assertEquals(e.roles.at(-1), [7, 'super-admin']);
  assertEquals(e.roles[0], [7, 'admin-sucursal']);
});
