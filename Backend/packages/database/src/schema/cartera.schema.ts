import { sql } from 'drizzle-orm';
import {
    char,
    check,
    datetime,
    decimal,
    index,
    int,
    mysqlTable,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/mysql-core';
import { sucursales } from './administracion.schema.ts';
import { usuarios } from './autenticacion.schema.ts';
import { clientes, facturas } from './facturacion.schema.ts';

/**
 * Tabla: creditos_b2b
 * Obligación de cartera corporativa derivada de una factura emitida a crédito.
 */
export const creditos_b2b = mysqlTable('creditos_b2b', {
    id_credito: char('id_credito', { length: 36 })
        .notNull()
        .default(sql.raw('(UUID())'))
        .primaryKey(),
    factura_id: char('factura_id', { length: 36 })
        .notNull()
        .references(() => facturas.id_factura, { onDelete: 'restrict' }),
    cliente_id: char('cliente_id', { length: 36 })
        .notNull()
        .references(() => clientes.id_cliente, { onDelete: 'restrict' }),
    sucursal_id: int('sucursal_id')
        .notNull()
        .references(() => sucursales.id_sucursal, { onDelete: 'restrict' }),
    monto: decimal('monto', { precision: 14, scale: 2 }).notNull(),
    saldo: decimal('saldo', { precision: 14, scale: 2 }).notNull(),
    fecha_emision: datetime('fecha_emision', { mode: 'date' }).notNull(),
    fecha_vencimiento: datetime('fecha_vencimiento', { mode: 'date' }).notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('vigente'),
    created_at: datetime('created_at', { mode: 'date' })
        .notNull()
        .default(sql.raw('CURRENT_TIMESTAMP')),
    updated_at: datetime('updated_at', { mode: 'date' })
        .notNull()
        .default(sql.raw('CURRENT_TIMESTAMP')),
}, (table) => [
    uniqueIndex('uq_creditos_b2b_factura').on(table.factura_id),
    index('idx_creditos_b2b_cliente').on(table.cliente_id),
    index('idx_creditos_b2b_sucursal').on(table.sucursal_id),
    index('idx_creditos_b2b_estado').on(table.estado),
    index('idx_creditos_b2b_vencimiento').on(table.fecha_vencimiento),
    check('chk_creditos_b2b_monto', sql`${table.monto} > 0`),
    check('chk_creditos_b2b_saldo', sql`${table.saldo} >= 0 AND ${table.saldo} <= ${table.monto}`),
    check('chk_creditos_b2b_fechas', sql`${table.fecha_vencimiento} >= ${table.fecha_emision}`),
    check('chk_creditos_b2b_estado', sql`${table.estado} IN ('vigente', 'pagado')`),
]);

export type CreditoB2BRecord = typeof creditos_b2b.$inferSelect;
export type NuevoCreditoB2BRecord = typeof creditos_b2b.$inferInsert;

/**
 * Tabla: abonos_credito_b2b
 * Pagos aplicados a un crédito B2B (append-only mediante triggers SQL).
 */
export const abonos_credito_b2b = mysqlTable('abonos_credito_b2b', {
    id_abono: char('id_abono', { length: 36 })
        .notNull()
        .default(sql.raw('(UUID())'))
        .primaryKey(),
    credito_id: char('credito_id', { length: 36 })
        .notNull()
        .references(() => creditos_b2b.id_credito, { onDelete: 'restrict' }),
    monto: decimal('monto', { precision: 14, scale: 2 }).notNull(),
    fecha: datetime('fecha', { mode: 'date' })
        .notNull()
        .default(sql.raw('CURRENT_TIMESTAMP')),
    registrado_por: char('registrado_por', { length: 36 })
        .notNull()
        .references(() => usuarios.id_usuario, { onDelete: 'restrict' }),
    aviso_id: char('aviso_id', { length: 36 }),
    created_at: datetime('created_at', { mode: 'date' })
        .notNull()
        .default(sql.raw('CURRENT_TIMESTAMP')),
}, (table) => [
    index('idx_abonos_credito_credito').on(table.credito_id),
    index('idx_abonos_credito_registrado_por').on(table.registrado_por),
    index('idx_abonos_credito_aviso').on(table.aviso_id),
    index('idx_abonos_credito_fecha').on(table.fecha),
    check('chk_abonos_credito_monto', sql`${table.monto} > 0`),
]);

export type AbonoCreditoB2BRecord = typeof abonos_credito_b2b.$inferSelect;
export type NuevoAbonoCreditoB2BRecord = typeof abonos_credito_b2b.$inferInsert;

/**
 * Tabla: avisos_pago_credito_b2b
 * Avisos de pago reportados por el vendedor B2B para revisión del admin de sucursal.
 */
export const avisos_pago_credito_b2b = mysqlTable('avisos_pago_credito_b2b', {
    id_aviso: char('id_aviso', { length: 36 })
        .notNull()
        .default(sql.raw('(UUID())'))
        .primaryKey(),
    credito_id: char('credito_id', { length: 36 })
        .notNull()
        .references(() => creditos_b2b.id_credito, { onDelete: 'restrict' }),
    monto: decimal('monto', { precision: 14, scale: 2 }).notNull(),
    referencia: varchar('referencia', { length: 100 }).notNull(),
    nota: varchar('nota', { length: 300 }),
    estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
    avisado_por: char('avisado_por', { length: 36 })
        .notNull()
        .references(() => usuarios.id_usuario, { onDelete: 'restrict' }),
    fecha_aviso: datetime('fecha_aviso', { mode: 'date' })
        .notNull()
        .default(sql.raw('CURRENT_TIMESTAMP')),
    revisado_por: char('revisado_por', { length: 36 })
        .references(() => usuarios.id_usuario, { onDelete: 'set null' }),
    fecha_revision: datetime('fecha_revision', { mode: 'date' }),
    motivo_rechazo: varchar('motivo_rechazo', { length: 300 }),
}, (table) => [
    index('idx_avisos_pago_credito').on(table.credito_id),
    index('idx_avisos_pago_estado').on(table.estado),
    index('idx_avisos_pago_avisado_por').on(table.avisado_por),
    index('idx_avisos_pago_credito_ref_estado').on(table.credito_id, table.referencia, table.estado),
    check('chk_avisos_pago_monto', sql`${table.monto} > 0`),
    check('chk_avisos_pago_estado', sql`${table.estado} IN ('pendiente', 'confirmado', 'rechazado')`),
]);

export type AvisoPagoCreditoB2BRecord = typeof avisos_pago_credito_b2b.$inferSelect;
export type NuevoAvisoPagoCreditoB2BRecord = typeof avisos_pago_credito_b2b.$inferInsert;
