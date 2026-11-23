/**
 * mod.ts — Punto de entrada de @inventa/composition.
 *
 * Exportará la función createContainer(env) que es el único lugar del
 * monorepo donde core, database y platform se conocen mutuamente.
 */

export * from './src/container.ts';
