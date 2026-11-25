import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  ActualizarLogoEmpresaUseCase,
  Cuenta,
  IAuditor,
  ICuentaRepository,
  IMarcaEmpresaRepository,
  IPasswordService,
  IPlanRepository,
  ISuscripcionRepository,
  ITokenCuentaService,
  IAnalizadorLogo,
  LogoValidado,
  MarcaEmpresa,
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
  logos = new Map<string, LogoValidado>();
  crear(d: { email: string; nombre: string; passwordHash: string; logo?: LogoValidado | null }) {
    const { logo, ...datos } = d;
    const c: Cuenta = { id: `c-${this.cuentas.length + 1}`, ...datos, empresaId: null, colorPrincipal: logo?.colorPrincipal ?? null, logoVersion: logo?.version ?? null, creadaEn: new Date() };
    if (logo) this.logos.set(c.id, logo);
    this.cuentas.push(c);
    return Promise.resolve(c);
  }
  actualizarLogo(cuentaId: string, logo: LogoValidado) { this.logos.set(cuentaId, logo); return Promise.resolve(); }
  obtenerLogo(cuentaId: string) { return Promise.resolve(this.logos.get(cuentaId)?.png ?? null); }
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
const analizador: IAnalizadorLogo = {
  analizar: (b) => (b[0] === 0x89 ? { ok: true, colorPrincipal: '#2a9d8f', ancho: 10, alto: 10 } : { ok: false, error: 'El logo debe ser una imagen PNG.' }),
};
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const tokens: ITokenCuentaService = {
  generar: (id) => Promise.resolve(`token-${id}`),
  validar: (t) => Promise.resolve({ cuentaId: t.replace('token-', '') }),
};

Deno.test('RegistrarCuenta: crea la cuenta gratuita normalizando el correo y sin exponer el hash', async () => {
  const repo = new CuentasEnMemoria();
  const r = await new RegistrarCuentaUseCase(repo, passwords, tokens, analizador).execute({ nombre: ' Ana ', email: ' Ana@Correo.CO ', password: 'Segura.2026!', logoPng: PNG });
  assert(r.isSuccess);
  assertEquals(r.value.cuenta.email, 'ana@correo.co');
  assertEquals(r.value.cuenta.empresaId, null);
  assertEquals('passwordHash' in r.value.cuenta, false);
  assertEquals(repo.cuentas[0].passwordHash, 'hash:Segura.2026!');
  assertEquals(r.value.token, 'token-c-1');
});

Deno.test('RegistrarCuenta: rechaza correos usados en una empresa o en otra cuenta', async () => {
  const repo = new CuentasEnMemoria();
  const uc = new RegistrarCuentaUseCase(repo, passwords, tokens, analizador);
  const r1 = await uc.execute({ nombre: 'Cajero', email: 'cajero@empresa.co', password: 'Segura.2026!', logoPng: PNG });
  assert(r1.isFailure);
  assertEquals(r1.error.code, 'EMAIL_YA_REGISTRADO');
  await uc.execute({ nombre: 'Ana', email: 'ana@correo.co', password: 'Segura.2026!', logoPng: PNG });
  const r2 = await uc.execute({ nombre: 'Otra Ana', email: 'ANA@correo.co', password: 'Segura.2026!', logoPng: PNG });
  assertEquals(r2.isFailure && r2.error.code, 'EMAIL_YA_REGISTRADO');
});

Deno.test('IniciarSesionCuenta: mismo error para correo inexistente y clave incorrecta', async () => {
  const repo = new CuentasEnMemoria();
  await new RegistrarCuentaUseCase(repo, passwords, tokens, analizador).execute({ nombre: 'Ana', email: 'ana@correo.co', password: 'Segura.2026!', logoPng: PNG });
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
  const { value } = await new RegistrarCuentaUseCase(repo, passwords, tokens, analizador).execute({ nombre: 'Ana', email: 'ana@correo.co', password: 'Segura.2026!', logoPng: PNG }) as { value: { cuenta: { id: string } } };
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

Deno.test('RegistrarCuenta: exige un logo PNG válido y guarda su color principal', async () => {
  const repo = new CuentasEnMemoria();
  const uc = new RegistrarCuentaUseCase(repo, passwords, tokens, analizador);
  const malo = await uc.execute({ nombre: 'Ana', email: 'ana@correo.co', password: 'Segura.2026!', logoPng: new Uint8Array([0xff, 0xd8]) });
  assertEquals(malo.isFailure && malo.error.code, 'LOGO_INVALIDO');
  assertEquals(repo.cuentas.length, 0);
  const ok = await uc.execute({ nombre: 'Ana', email: 'ana@correo.co', password: 'Segura.2026!', logoPng: PNG });
  assert(ok.isSuccess);
  assertEquals(ok.value.cuenta.colorPrincipal, '#2a9d8f');
  assertEquals(await repo.obtenerLogo(ok.value.cuenta.id), PNG);
});

Deno.test('ActualizarLogoEmpresa: actualiza logo y color de la empresa activa y registra auditoría', async () => {
  const eventos: unknown[] = [];
  const auditor: IAuditor = {
    registrar: (e) => {
      eventos.push(e);
      return Promise.resolve();
    },
  };
  let marcaActual: MarcaEmpresa | null = { colorPrincipal: '#112233', logoVersion: 'v0' };
  let bytesLogo: Uint8Array | null = null;
  const marcas: IMarcaEmpresaRepository = {
    obtener: (id) => Promise.resolve(id === 1 ? marcaActual : null),
    obtenerLogo: (id) => Promise.resolve(id === 1 ? bytesLogo : null),
    actualizarLogo: (id, logo) => {
      if (id !== 1) return Promise.resolve(false);
      marcaActual = { colorPrincipal: logo.colorPrincipal, logoVersion: logo.version };
      bytesLogo = logo.png;
      return Promise.resolve(true);
    },
  };

  const uc = new ActualizarLogoEmpresaUseCase(marcas, analizador, auditor);
  const actor = { usuarioId: 'super-1', ip: '127.0.0.1' };

  const invalido = await uc.execute({ empresaId: 1, logoPng: new Uint8Array([0xff, 0xd8]), actor });
  assertEquals(invalido.isFailure && invalido.error.code, 'LOGO_INVALIDO');
  assertEquals(eventos.length, 0);

  const inexistente = await uc.execute({ empresaId: 99, logoPng: PNG, actor });
  assertEquals(inexistente.isFailure && inexistente.error.code, 'EMPRESA_NO_ENCONTRADA');

  const ok = await uc.execute({ empresaId: 1, logoPng: PNG, actor });
  assert(ok.isSuccess);
  assertEquals(ok.value.colorPrincipal, '#2a9d8f');
  assertEquals(bytesLogo, PNG);
  assertEquals(eventos.length, 1);
});
