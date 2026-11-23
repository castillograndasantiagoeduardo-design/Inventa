/**
 * mod.ts — Punto de entrada de @inventa/database.
 *
 * Exporta los adaptadores de persistencia:
 *   - schema        → tablas Drizzle (autenticacion, administracion…)
 *
 * REGLA: este paquete implementa ports de @inventa/core, pero core
 * no lo importa a él. La dirección de dependencia es unidireccional.
 */

export * from './src/schema/index.ts';
