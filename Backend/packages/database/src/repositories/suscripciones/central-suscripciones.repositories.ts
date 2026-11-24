/**
 * Repositorios de la base central para cuentas, planes, suscripciones y pagos.
 */

import { and, asc, desc, eq, gt, lte } from 'drizzle-orm';
import type {
  Cuenta,
  EstadoPago,
  ICuentaRepository,
  IPagoRepository,
  IPlanRepository,
  ISuscripcionRepository,
  Pago,
  Plan,
  SuscripcionVigente,
} from '@inventa/core';
import { getCentralDatabase, type CentralDatabase } from '../../tenancy/bases-empresa.ts';
import { cuentas, directorioUsuarios, pagos, planes, planPermisos, suscripciones } from '../../tenancy/central.schema.ts';

type Central = () => CentralDatabase;

const aCuenta = (f: typeof cuentas.$inferSelect): Cuenta => ({
  id: f.id_cuenta,
  email: f.email,
  nombre: f.nombre,
  passwordHash: f.password_hash,
  empresaId: f.empresa_id ?? null,
  creadaEn: f.created_at,
});

export class CentralCuentaRepository implements ICuentaRepository {
  constructor(private readonly central: Central = getCentralDatabase) {}

  async buscarPorEmail(email: string): Promise<Cuenta | null> {
    const [f] = await this.central().select().from(cuentas).where(eq(cuentas.email, email.trim().toLowerCase())).limit(1);
    return f ? aCuenta(f) : null;
  }

  async buscarPorId(id: string): Promise<Cuenta | null> {
    const [f] = await this.central().select().from(cuentas).where(eq(cuentas.id_cuenta, id)).limit(1);
    return f ? aCuenta(f) : null;
  }

  async correoOcupado(email: string): Promise<boolean> {
    const normalizado = email.trim().toLowerCase();
    const [enCuentas] = await this.central().select({ id: cuentas.id_cuenta }).from(cuentas).where(eq(cuentas.email, normalizado)).limit(1);
    if (enCuentas) return true;
    const [enDirectorio] = await this.central().select({ e: directorioUsuarios.email }).from(directorioUsuarios).where(eq(directorioUsuarios.email, normalizado)).limit(1);
    return Boolean(enDirectorio);
  }

  async crear(datos: { email: string; nombre: string; passwordHash: string }): Promise<Cuenta> {
    const id = crypto.randomUUID();
    await this.central().insert(cuentas).values({ id_cuenta: id, email: datos.email, nombre: datos.nombre, password_hash: datos.passwordHash });
    const creada = await this.buscarPorId(id);
    if (!creada) throw new Error('No se pudo leer la cuenta recién creada.');
    return creada;
  }

  async asignarEmpresa(cuentaId: string, empresaId: number): Promise<void> {
    await this.central().update(cuentas).set({ empresa_id: empresaId }).where(eq(cuentas.id_cuenta, cuentaId));
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
  creadoEn: f.created_at,
});

export class CentralPagoRepository implements IPagoRepository {
  constructor(private readonly central: Central = getCentralDatabase) {}

  async crear(datos: { referencia: string; cuentaId: string; planId: string; montoCentavos: number; pasarela: string }): Promise<Pago> {
    const id = crypto.randomUUID();
    await this.central().insert(pagos).values({
      id_pago: id,
      referencia: datos.referencia,
      cuenta_id: datos.cuentaId,
      plan_id: datos.planId,
      monto_centavos: datos.montoCentavos,
      pasarela: datos.pasarela,
    });
    const creado = await this.buscarPorReferencia(datos.referencia);
    if (!creado) throw new Error('No se pudo leer el pago recién creado.');
    return creado;
  }

  async buscarPorReferencia(referencia: string): Promise<Pago | null> {
    const [f] = await this.central().select().from(pagos).where(eq(pagos.referencia, referencia)).limit(1);
    return f ? aPago(f) : null;
  }

  async marcarSiPendiente(pagoId: string, estado: Exclude<EstadoPago, 'pendiente'>, transaccionExterna: string | null): Promise<boolean> {
    const [resultado] = await this.central()
      .update(pagos)
      .set({ estado, transaccion_externa: transaccionExterna })
      .where(and(eq(pagos.id_pago, pagoId), eq(pagos.estado, 'pendiente')));
    return resultado.affectedRows === 1;
  }
}
