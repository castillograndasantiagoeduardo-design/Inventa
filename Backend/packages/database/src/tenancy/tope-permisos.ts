/**
 * tope-permisos.ts — Permisos efectivos = permisos del rol ∩ permisos del plan vigente.
 *
 * - Empresa por defecto (instalación original, empresa n.º 1): sin tope.
 * - Otras empresas: tope = permisos del plan de su suscripción vigente
 *   (inicia_en <= ahora < vence_en). Sin suscripción vigente → tope vacío:
 *   la empresa queda bloqueada hasta renovar.
 */

import { and, desc, eq, gt, lte } from 'drizzle-orm';
import type { IRolRepository } from '@inventa/core';
import { obtenerContextoEmpresa } from './contexto-empresa.ts';
import { contextoPorDefecto, getCentralDatabase, type CentralDatabase } from './bases-empresa.ts';
import { planPermisos, suscripciones } from './central.schema.ts';

const TTL_CACHE_MS = 30_000;

export class TopePermisosPlan {
  private readonly cache = new Map<number, { permisos: Set<string>; expira: number }>();

  constructor(private readonly central: () => CentralDatabase = getCentralDatabase) {}

  /** Plan vigente de la empresa, o null si no tiene suscripción vigente. */
  async planVigente(empresaId: number, ahora = new Date()): Promise<{ planId: string; venceEn: Date } | null> {
    const [fila] = await this.central()
      .select({ planId: suscripciones.plan_id, venceEn: suscripciones.vence_en })
      .from(suscripciones)
      .where(and(eq(suscripciones.empresa_id, empresaId), lte(suscripciones.inicia_en, ahora), gt(suscripciones.vence_en, ahora)))
      .orderBy(desc(suscripciones.vence_en))
      .limit(1);
    return fila ?? null;
  }

  /** null = sin tope (empresa por defecto o fuera de contexto). */
  async permisosPermitidos(empresaId: number | undefined): Promise<Set<string> | null> {
    if (empresaId === undefined || empresaId === contextoPorDefecto().empresaId) return null;

    const enCache = this.cache.get(empresaId);
    if (enCache && enCache.expira > Date.now()) return enCache.permisos;

    const plan = await this.planVigente(empresaId);
    let permisos = new Set<string>();
    if (plan) {
      const filas = await this.central()
        .select({ codigo: planPermisos.permiso_codigo })
        .from(planPermisos)
        .where(eq(planPermisos.plan_id, plan.planId));
      permisos = new Set(filas.map((f) => f.codigo));
    }
    this.cache.set(empresaId, { permisos, expira: Date.now() + TTL_CACHE_MS });
    return permisos;
  }

  invalidar(empresaId?: number): void {
    if (empresaId === undefined) this.cache.clear();
    else this.cache.delete(empresaId);
  }
}

/**
 * Decorador de un repositorio de roles que aplica el tope del plan de la empresa actual
 * a obtenerPermisosDeRol. El resto de métodos (catálogo de roles, etc.) se reenvían igual.
 */
export function conTopePlan<T extends IRolRepository>(base: T, tope: TopePermisosPlan): T {
  return new Proxy(base, {
    get(objetivo, propiedad, receptor) {
      if (propiedad === 'obtenerPermisosDeRol') {
        return async (rolId: number): Promise<string[]> => {
          const permisos = await objetivo.obtenerPermisosDeRol(rolId);
          const permitidos = await tope.permisosPermitidos(obtenerContextoEmpresa()?.empresaId);
          return permitidos === null ? permisos : permisos.filter((p) => permitidos.has(p));
        };
      }
      const valor = Reflect.get(objetivo, propiedad, receptor);
      return typeof valor === 'function' ? valor.bind(objetivo) : valor;
    },
  });
}
