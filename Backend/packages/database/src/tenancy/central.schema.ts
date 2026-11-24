/**
 * central.schema.ts — Tablas Drizzle de la base CENTRAL (inventa_central).
 *
 * No forma parte del esquema operativo de cada empresa: se usa solo con la
 * instancia de getCentralDatabase(). Coincide con Docs/database/central/INVENTA_CENTRAL_BD.sql.
 */

import { bigint, char, customType, datetime, index, int, json, mysqlTable, primaryKey, tinyint, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { Buffer } from 'node:buffer';

/** MEDIUMBLOB (hasta 16 MB) para el logo PNG de la empresa. */
const mediumblob = customType<{ data: Uint8Array; driverData: Buffer }>({
  dataType: () => 'mediumblob',
  toDriver: (valor) => Buffer.from(valor),
  fromDriver: (valor) => new Uint8Array(valor),
});

export const empresas = mysqlTable('empresas', {
  id_empresa: int('id_empresa').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  nit: varchar('nit', { length: 30 }),
  db_nombre: varchar('db_nombre', { length: 64 }).notNull(),
  estado: varchar('estado', { length: 20 }).notNull().default('activa'),
  logo_png: mediumblob('logo_png'),
  logo_version: char('logo_version', { length: 16 }),
  color_principal: char('color_principal', { length: 7 }),
  created_at: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [uniqueIndex('uq_empresas_db_nombre').on(t.db_nombre)]);

export const directorioUsuarios = mysqlTable('directorio_usuarios', {
  email: varchar('email', { length: 150 }).primaryKey(),
  empresa_id: int('empresa_id').notNull(),
  created_at: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [index('idx_directorio_empresa').on(t.empresa_id)]);

export const cuentas = mysqlTable('cuentas', {
  id_cuenta: char('id_cuenta', { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar('email', { length: 150 }).notNull(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  empresa_id: int('empresa_id'),
  logo_png: mediumblob('logo_png'),
  logo_version: char('logo_version', { length: 16 }),
  color_principal: char('color_principal', { length: 7 }),
  created_at: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [uniqueIndex('uq_cuentas_email').on(t.email)]);

export const planes = mysqlTable('planes', {
  id_plan: varchar('id_plan', { length: 20 }).primaryKey(),
  nombre: varchar('nombre', { length: 60 }).notNull(),
  etiqueta: varchar('etiqueta', { length: 40 }).notNull(),
  descripcion: varchar('descripcion', { length: 255 }).notNull(),
  precio_centavos: bigint('precio_centavos', { mode: 'number' }).notNull(),
  dias_vigencia: int('dias_vigencia').notNull().default(30),
  max_sucursales: int('max_sucursales'),
  orden: int('orden').notNull().default(0),
  activo: tinyint('activo').notNull().default(1),
});

export const planPermisos = mysqlTable('plan_permisos', {
  plan_id: varchar('plan_id', { length: 20 }).notNull(),
  permiso_codigo: varchar('permiso_codigo', { length: 80 }).notNull(),
}, (t) => [primaryKey({ columns: [t.plan_id, t.permiso_codigo] })]);

export const pagos = mysqlTable('pagos', {
  id_pago: char('id_pago', { length: 36 }).primaryKey().default(sql`(UUID())`),
  referencia: varchar('referencia', { length: 40 }).notNull(),
  cuenta_id: char('cuenta_id', { length: 36 }).notNull(),
  plan_id: varchar('plan_id', { length: 20 }).notNull(),
  monto_centavos: bigint('monto_centavos', { mode: 'number' }).notNull(),
  moneda: char('moneda', { length: 3 }).notNull().default('COP'),
  pasarela: varchar('pasarela', { length: 20 }).notNull().default('simulada'),
  estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
  transaccion_externa: varchar('transaccion_externa', { length: 80 }),
  detalle: json('detalle'),
  created_at: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  actualizado_en: datetime('actualizado_en', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [uniqueIndex('uq_pagos_referencia').on(t.referencia), index('idx_pagos_cuenta').on(t.cuenta_id)]);

export const suscripciones = mysqlTable('suscripciones', {
  id_suscripcion: char('id_suscripcion', { length: 36 }).primaryKey().default(sql`(UUID())`),
  empresa_id: int('empresa_id').notNull(),
  plan_id: varchar('plan_id', { length: 20 }).notNull(),
  pago_id: char('pago_id', { length: 36 }),
  inicia_en: datetime('inicia_en', { mode: 'date' }).notNull(),
  vence_en: datetime('vence_en', { mode: 'date' }).notNull(),
  created_at: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [uniqueIndex('uq_suscripciones_pago').on(t.pago_id), index('idx_suscripciones_empresa_vence').on(t.empresa_id, t.vence_en)]);

export const centralSchema = { empresas, directorioUsuarios, cuentas, planes, planPermisos, pagos, suscripciones };
