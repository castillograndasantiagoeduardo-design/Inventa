import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  Cuenta,
  ICuentaRepository,
  IPasswordService,
  IPlanRepository,
  ISuscripcionRepository,
  ITokenCuentaService,
  IniciarSesionCuentaUseCase,
  ObtenerMiCuentaUseCase,
  Plan,
  RegistrarCuentaUseCase,
} from '../../mod.ts';

class CuentasEnMemoria implements ICuentaRepository {
  cuentas: Cuenta[] = [];
  ocupadosEnEmpresas = new Set<string>(['cajero@empresa.co']);
  buscarPorEmail(email: string) { return Promise.resolve(this.cuentas.find((c) => c.email === email) ?? null); }
  buscarPorId(id: string) { return Promise.resolve(this.cuentas.find((c) => c.id === id) ?? null); }
  correoOcupado(email: string) { return Promise.resolve(this.ocupadosEnEmpresas.has(email) || this.cuentas.some((c) => c.email === email)); }
  crear(d: { email: string; nombre: string; passwordHash: string }) {
    const c: Cuenta = { id: `c-${this.cuentas.length + 1}`, ...d, empresaId: null, creadaEn: new Date() };
    this.cuentas.push(c);
    return Promise.resolve(c);
  }
  asignarEmpresa(cuentaId: string, empresaId: number) {
    const c = this.cuentas.find((x) => x.id === cuentaId);
    if (c) c.empresaId = empresaId;
    return Promise.resolve();
  }
}

const passwords: IPasswordService = {
  hashear: (p) => Promise.resolve(`hash:${p}`),
  comparar: (p, h) => Promise.resolve(h === `hash:${p}`),
};
const tokens: ITokenCuentaService = {
  generar: (id) => Promise.resolve(`token-${id}`),
  validar: (t) => Promise.resolve({ cuentaId: t.replace('token-', '') }),
};

Deno.test('RegistrarCuenta: crea la cuenta gratuita normalizando el correo y sin exponer el hash', async () => {
  const repo = new CuentasEnMemoria();
  const r = await new RegistrarCuentaUseCase(repo, passwords, tokens).execute({ nombre: ' Ana ', email: ' Ana@Correo.CO ', password: 'Segura.2026!' });
  assert(r.isSuccess);
  assertEquals(r.value.cuenta.email, 'ana@correo.co');
  assertEquals(r.value.cuenta.empresaId, null);
  assertEquals('passwordHash' in r.value.cuenta, false);
  assertEquals(repo.cuentas[0].passwordHash, 'hash:Segura.2026!');
  assertEquals(r.value.token, 'token-c-1');
});

Deno.test('RegistrarCuenta: rechaza correos usados en una empresa o en otra cuenta', async () => {
  const repo = new CuentasEnMemoria();
  const uc = new RegistrarCuentaUseCase(repo, passwords, tokens);
  const r1 = await uc.execute({ nombre: 'Cajero', email: 'cajero@empresa.co', password: 'Segura.2026!' });
  assert(r1.isFailure);
  assertEquals(r1.error.code, 'EMAIL_YA_REGISTRADO');
  await uc.execute({ nombre: 'Ana', email: 'ana@correo.co', password: 'Segura.2026!' });
  const r2 = await uc.execute({ nombre: 'Otra Ana', email: 'ANA@correo.co', password: 'Segura.2026!' });
  assertEquals(r2.isFailure && r2.error.code, 'EMAIL_YA_REGISTRADO');
});

Deno.test('IniciarSesionCuenta: mismo error para correo inexistente y clave incorrecta', async () => {
  const repo = new CuentasEnMemoria();
  await new RegistrarCuentaUseCase(repo, passwords, tokens).execute({ nombre: 'Ana', email: 'ana@correo.co', password: 'Segura.2026!' });
  const uc = new IniciarSesionCuentaUseCase(repo, passwords, tokens);
  const ok = await uc.execute({ email: 'ANA@correo.co', password: 'Segura.2026!' });
  assert(ok.isSuccess);
  const mala = await uc.execute({ email: 'ana@correo.co', password: 'otra' });
  const inexistente = await uc.execute({ email: 'nadie@correo.co', password: 'Segura.2026!' });
  assertEquals(mala.isFailure && mala.error.code, 'CREDENCIALES_INVALIDAS');
  assertEquals(inexistente.isFailure && inexistente.error.code, 'CREDENCIALES_INVALIDAS');
});

Deno.test('ObtenerMiCuenta: sin empresa no hay suscripción; con plan vigente la devuelve', async () => {
  const repo = new CuentasEnMemoria();
  const { value } = await new RegistrarCuentaUseCase(repo, passwords, tokens).execute({ nombre: 'Ana', email: 'ana@correo.co', password: 'Segura.2026!' }) as { value: { cuenta: { id: string } } };
  const vence = new Date(Date.now() + 864e5);
  const suscripciones: ISuscripcionRepository = {
    vigenteDeEmpresa: (empresaId) => Promise.resolve(empresaId === 9 ? { empresaId, planId: 'tienda', iniciaEn: new Date(), venceEn: vence } : null),
    registrar: () => Promise.resolve(),
    buscarPorPago: () => Promise.resolve(null),
  };
  const planes: IPlanRepository = {
    listarActivos: () => Promise.resolve([]),
    buscar: (id) => Promise.resolve({ id, nombre: 'Tienda' } as Plan),
  };
  const uc = new ObtenerMiCuentaUseCase(repo, suscripciones, planes);
  const gratis = await uc.execute(value.cuenta.id);
  assertEquals(gratis.isSuccess && gratis.value.suscripcion, null);
  await repo.asignarEmpresa(value.cuenta.id, 9);
  const conPlan = await uc.execute(value.cuenta.id);
  assertEquals(conPlan.isSuccess && conPlan.value.suscripcion, { planId: 'tienda', planNombre: 'Tienda', venceEn: vence, vigente: true });
  const noExiste = await uc.execute('x');
  assertEquals(noExiste.isFailure && noExiste.error.code, 'CUENTA_NO_ENCONTRADA');
});
