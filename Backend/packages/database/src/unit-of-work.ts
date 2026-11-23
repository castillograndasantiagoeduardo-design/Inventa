/**
 * unit-of-work.ts — Transacciones atómicas multi-tabla.
 *
 * Garantiza que operaciones que afectan múltiples tablas se ejecuten
 * dentro de una sola transacción de base de datos.
 *
 * Si cualquier paso falla, se hace rollback completo.
 * Implementa el port IUnitOfWork definido en @inventa/core.
 */

import { Database } from './client.ts';
import { IUnitOfWork } from '@inventa/core';

export class DrizzleUnitOfWork implements IUnitOfWork {
    constructor(private readonly db: Database) { }

    public async run<T>(work: () => Promise<T>): Promise<T> {
        return await this.db.transaction(async () => {
            return await work();
        });
    }
}
