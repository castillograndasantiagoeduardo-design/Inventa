/**
 * Repositorios de la base central para cuentas, planes, suscripciones y pagos.
 */

import { and, asc, desc, eq, gt, lte } from 'drizzle-orm';
import type {
  Cuenta,
  EstadoPago,
  ICuentaRepository,
  IMarcaEmpresaRepository,
  LogoValidado,
  MarcaEmpresa,
  IPagoRepository,
  IPlanRepository,
  ISuscripcionRepository,
  Pago,
  Plan,
  SuscripcionVigente,
} from '@inventa/core';
import { getCentralDatabase, type CentralDatabase } from '../../tenancy/bases-empresa.ts';
import { cuentas, directorioUsuarios, empresas, pagos, planes, planPermisos, suscripciones } from '../../tenancy/central.schema.ts';

type Central = () => CentralDatabase;

/** Columnas de la cuenta SIN el logo (los bytes solo se leen en obtenerLogo). */
const COLUMNAS_CUENTA = {
  id_cuenta: cuentas.id_cuenta,
  email: cuentas.email,
  nombre: cuentas.nombre,
  password_hash: cuentas.password_hash,
  empresa_id: cuentas.empresa_id,
  logo_version: cuentas.logo_version,
  color_principal: cuentas.color_principal,
  created_at: cuentas.created_at,
};

type FilaCuenta = { [K in keyof typeof COLUMNAS_CUENTA]: (typeof cuentas.$inferSelect)[K] };

const aCuenta = (f: FilaCuenta): Cuenta => ({
  id: f.id_cuenta,
  email: f.email,
  nombre: f.nombre,
  passwordHash: f.password_hash,
  empresaId: f.empresa_id ?? null,
  colorPrincipal: f.color_principal ?? null,
  logoVersion: f.logo_version ?? null,
  creadaEn: f.created_at,
});

export class CentralCuentaRepository implements ICuentaRepository {
  constructor(private readonly central: Central = getCentralDatabase) {}

  async buscarPorEmail(email: string): Promise<Cuenta | null> {
    const [f] = await this.central().select(COLUMNAS_CUENTA).from(cuentas).where(eq(cuentas.email, email.trim().toLowerCase())).limit(1);
    return f ? aCuenta(f) : null;
  }

  async buscarPorId(id: string): Promise<Cuenta | null> {
    const [f] = await this.central().select(COLUMNAS_CUENTA).from(cuentas).where(eq(cuentas.id_cuenta, id)).limit(1);
    return f ? aCuenta(f) : null;
  }

  async correoOcupado(email: string): Promise<boolean> {
    const normalizado = email.trim().toLowerCase();
    const [enCuentas] = await this.central().select({ id: cuentas.id_cuenta }).from(cuentas).where(eq(cuentas.email, normalizado)).limit(1);
    if (enCuentas) return true;
    const [enDirectorio] = await this.central().select({ e: directorioUsuarios.email }).from(directorioUsuarios).where(eq(directorioUsuarios.email, normalizado)).limit(1);
    return Boolean(enDirectorio);
  }

  async crear(datos: { email: string; nombre: string; passwordHash: string; logo?: LogoValidado | null }): Promise<Cuenta> {
    const id = crypto.randomUUID();
    await this.central().insert(cuentas).values({
      id_cuenta: id,
      email: datos.email,
      nombre: datos.nombre,
      password_hash: datos.passwordHash,
      logo_png: datos.logo?.png ?? null,
      logo_version: datos.logo?.version ?? null,
      color_principal: datos.logo?.colorPrincipal ?? null,
    });
    const creada = await this.buscarPorId(id);
    if (!creada) throw new Error('No se pudo leer la cuenta recién creada.');
    return creada;
  }

  async asignarEmpresa(cuentaId: string, empresaId: number): Promise<void> {
    await this.central().update(cuentas).set({ empresa_id: empresaId }).where(eq(cuentas.id_cuenta, cuentaId));
    // La empresa hereda la marca (logo y color) que el dueño subió al registrarse.
    const [marca] = await this.central()
      .select({ png: cuentas.logo_png, version: cuentas.logo_version, color: cuentas.color_principal })
      .from(cuentas).where(eq(cuentas.id_cuenta, cuentaId)).limit(1);
    if (marca?.png) {
      await this.central().update(empresas)
        .set({ logo_png: marca.png, logo_version: marca.version, color_principal: marca.color })
        .where(eq(empresas.id_empresa, empresaId));
    }
  }

  async actualizarLogo(cuentaId: string, logo: LogoValidado): Promise<void> {
    const valores = { logo_png: logo.png, logo_version: logo.version, color_principal: logo.colorPrincipal };
    await this.central().update(cuentas).set(valores).where(eq(cuentas.id_cuenta, cuentaId));
    const cuenta = await this.buscarPorId(cuentaId);
    if (cuenta?.empresaId) await this.central().update(empresas).set(valores).where(eq(empresas.id_empresa, cuenta.empresaId));
  }

  async obtenerLogo(cuentaId: string): Promise<Uint8Array | null> {
    const [f] = await this.central().select({ png: cuentas.logo_png }).from(cuentas).where(eq(cuentas.id_cuenta, cuentaId)).limit(1);
    return f?.png ?? null;
  }
}

export class CentralPlanRepository implements IPlanRepository {
  constructor(private readonly central: Central = getCentralDatabase) {}

  private async conPermisos(filas: Array<typeof planes.$inferSelect>): Promise<Plan[]> {
    const permisos = await this.central().select().from(planPermisos);
    return filas.map((f) => ({
      id: f.id_plan,
      nombre: f.nombre,
      etiqueta: f.etiqueta,
      descripcion: f.descripcion,
      precioCentavos: f.precio_centavos,
      diasVigencia: f.dias_vigencia,
      maxSucursales: f.max_sucursales ?? null,
      orden: f.orden,
      permisos: permisos.filter((p) => p.plan_id === f.id_plan).map((p) => p.permiso_codigo).sort(),
    }));
  }

  async listarActivos(): Promise<Plan[]> {
    return this.conPermisos(await this.central().select().from(planes).where(eq(planes.activo, 1)).orderBy(asc(planes.orden)));
  }

  async buscar(planId: string): Promise<Plan | null> {
    const filas = await this.central().select().from(planes).where(and(eq(planes.id_plan, planId), eq(planes.activo, 1))).limit(1);
    return (await this.conPermisos(filas))[0] ?? null;
  }
}

export class CentralSuscripcionRepository implements ISuscripcionRepository {
  constructor(private readonly central: Central = getCentralDatabase) {}

  async vigenteDeEmpresa(empresaId: number, ahora = new Date()): Promise<SuscripcionVigente | null> {
    const [f] = await this.central()
      .select()
      .from(suscripciones)
      .where(and(eq(suscripciones.empresa_id, empresaId), lte(suscripciones.inicia_en, ahora), gt(suscripciones.vence_en, ahora)))
      .orderBy(desc(suscripciones.vence_en))
      .limit(1);
    return f ? { empresaId: f.empresa_id, planId: f.plan_id, iniciaEn: f.inicia_en, venceEn: f.vence_en } : null;
  }

  async registrar(datos: { empresaId: number; planId: string; pagoId: string; iniciaEn: Date; venceEn: Date }): Promise<void> {
    await this.central()
      .insert(suscripciones)
      .values({ empresa_id: datos.empresaId, plan_id: datos.planId, pago_id: datos.pagoId, inicia_en: datos.iniciaEn, vence_en: datos.venceEn })
      .onDuplicateKeyUpdate({ set: { pago_id: datos.pagoId } });
  }

  async buscarPorPago(pagoId: string): Promise<{ empresaId: number; venceEn: Date } | null> {
    const [f] = await this.central().select().from(suscripciones).where(eq(suscripciones.pago_id, pagoId)).limit(1);
    return f ? { empresaId: f.empresa_id, venceEn: f.vence_en } : null;
  }
}

const aPago = (f: typeof pagos.$inferSelect): Pago => ({
  id: f.id_pago,
  referencia: f.referencia,
  cuentaId: f.cuenta_id,
  planId: f.plan_id,
  montoCentavos: f.monto_centavos,
  moneda: f.moneda,
  pasarela: f.pasarela,
  estado: f.estado as EstadoPago,
  transaccionExterna: f.transaccion_externa ?? null,
  detalle: (f.detalle as Record<string, unknown> | null) ?? null,
  creadoEn: f.created_at,
});

export class CentralPagoRepository implements IPagoRepository {
  constructor(private readonly central: Central = getCentralDatabase) {}

  async crear(datos: { referencia: string; cuentaId: string; planId: string; montoCentavos: number; pasarela: string; detalle?: Record<string, unknown> | null }): Promise<Pago> {
    const id = crypto.randomUUID();
    await this.central().insert(pagos).values({
      id_pago: id,
      referencia: datos.referencia,
      cuenta_id: datos.cuentaId,
      plan_id: datos.planId,
      monto_centavos: datos.montoCentavos,
      pasarela: datos.pasarela,
      detalle: datos.detalle ?? null,
    });
    const creado = await this.buscarPorReferencia(datos.referencia);
    if (!creado) throw new Error('No se pudo leer el pago recién creado.');
    return creado;
  }

  async buscarPorReferencia(referencia: string): Promise<Pago | null> {
    const [f] = await this.central().select().from(pagos).where(eq(pagos.referencia, referencia)).limit(1);
    return f ? aPago(f) : null;
  }

  async agregarDetalle(referencia: string, datos: Record<string, unknown>): Promise<void> {
    const actual = await this.buscarPorReferencia(referencia);
    if (!actual) return;
    await this.central().update(pagos).set({ detalle: { ...(actual.detalle ?? {}), ...datos } }).where(eq(pagos.referencia, referencia));
  }

  async marcarSiPendiente(pagoId: string, estado: Exclude<EstadoPago, 'pendiente'>, transaccionExterna: string | null): Promise<boolean> {
    const [resultado] = await this.central()
      .update(pagos)
      .set({ estado, transaccion_externa: transaccionExterna })
      .where(and(eq(pagos.id_pago, pagoId), eq(pagos.estado, 'pendiente')));
    return resultado.affectedRows === 1;
  }
}

export class CentralMarcaEmpresaRepository implements IMarcaEmpresaRepository {
  constructor(private readonly central: Central = getCentralDatabase) {}

  async obtener(empresaId: number): Promise<MarcaEmpresa | null> {
    const [f] = await this.central()
      .select({ color: empresas.color_principal, version: empresas.logo_version })
      .from(empresas).where(eq(empresas.id_empresa, empresaId)).limit(1);
    return f ? { colorPrincipal: f.color ?? null, logoVersion: f.version ?? null } : null;
  }

  async obtenerLogo(empresaId: number): Promise<Uint8Array | null> {
    const [f] = await this.central().select({ png: empresas.logo_png }).from(empresas).where(eq(empresas.id_empresa, empresaId)).limit(1);
    return f?.png ?? null;
  }

  async actualizarLogo(empresaId: number, logo: LogoValidado): Promise<boolean> {
    const valores = { logo_png: logo.png, logo_version: logo.version, color_principal: logo.colorPrincipal };
    const [res] = await this.central().update(empresas).set(valores).where(eq(empresas.id_empresa, empresaId));
    if (res.affectedRows === 0) {
      const [existe] = await this.central().select({ id: empresas.id_empresa }).from(empresas).where(eq(empresas.id_empresa, empresaId)).limit(1);
      if (!existe) return false;
    }
    await this.central().update(cuentas).set(valores).where(eq(cuentas.empresa_id, empresaId));
    return true;
  }
}
