import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import type {
  AbonoCreditoDto,
  AvisoPagoCreditoDto,
  EstadoAvisoPago,
  EstadoCreditoPersistido,
  FiltrosAvisosPago,
  FiltrosCarteraB2B,
} from '@inventa/contracts';
import {
  CreditoB2B,
  type ICarteraRepository,
  type RegistrarAbonoAtomicoParams,
  type RegistrarAbonoAtomicoResult,
  type RentabilidadClienteRaw,
} from '@inventa/core';
import type { Database } from '../../client.ts';
import {
  abonos_credito_b2b,
  avisos_pago_credito_b2b,
  creditos_b2b,
} from '../../schema/cartera.schema.ts';
import { clientes, facturas } from '../../schema/facturacion.schema.ts';
import { usuarios } from '../../schema/autenticacion.schema.ts';
import { empleados } from '../../schema/administracion.schema.ts';

const avisadorUsuarios = alias(usuarios, 'avisador_usuarios');
const avisadorEmpleados = alias(empleados, 'avisador_empleados');
const revisorUsuarios = alias(usuarios, 'revisor_usuarios');
const revisorEmpleados = alias(empleados, 'revisor_empleados');

export class DrizzleCarteraRepository implements ICarteraRepository {
  constructor(private readonly db: Database) {}

  public async obtenerCreditoPorId(creditoId: string): Promise<CreditoB2B | null> {
    const [row] = await this.db
      .select({
        credito: creditos_b2b,
        facturaConsecutivo: facturas.consecutivo,
        clienteNombre: clientes.nombre_razon_social,
      })
      .from(creditos_b2b)
      .innerJoin(facturas, eq(creditos_b2b.factura_id, facturas.id_factura))
      .innerJoin(clientes, eq(creditos_b2b.cliente_id, clientes.id_cliente))
      .where(eq(creditos_b2b.id_credito, creditoId))
      .limit(1);

    if (!row) return null;
    return this.mapCredito(row.credito, row.facturaConsecutivo, row.clienteNombre);
  }

  public async listarCreditos(
    filtros: FiltrosCarteraB2B & { sucursalId?: number },
  ): Promise<{ items: CreditoB2B[]; total: number }> {
    const condiciones: SQL[] = [];
    if (filtros.clienteId) {
      condiciones.push(eq(creditos_b2b.cliente_id, filtros.clienteId));
    }
    if (filtros.sucursalId !== undefined) {
      condiciones.push(eq(creditos_b2b.sucursal_id, filtros.sucursalId));
    }
    if (filtros.estado === 'pagado') {
      condiciones.push(eq(creditos_b2b.estado, 'pagado'));
    } else if (filtros.estado === 'vigente' || filtros.estado === 'en_mora') {
      condiciones.push(eq(creditos_b2b.estado, 'vigente'));
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [countRow] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(creditos_b2b)
      .where(whereClause);
    const total = Number(countRow?.total ?? 0);

    if (total === 0) {
      return { items: [], total: 0 };
    }

    const rows = await this.db
      .select({
        credito: creditos_b2b,
        facturaConsecutivo: facturas.consecutivo,
        clienteNombre: clientes.nombre_razon_social,
      })
      .from(creditos_b2b)
      .innerJoin(facturas, eq(creditos_b2b.factura_id, facturas.id_factura))
      .innerJoin(clientes, eq(creditos_b2b.cliente_id, clientes.id_cliente))
      .where(whereClause)
      .orderBy(desc(creditos_b2b.fecha_emision))
      .limit(filtros.limite)
      .offset((filtros.pagina - 1) * filtros.limite);

    return {
      items: rows.map((r) => this.mapCredito(r.credito, r.facturaConsecutivo, r.clienteNombre)),
      total,
    };
  }

  public async listarCreditosPorCliente(
    clienteId: string,
    sucursalId?: number,
  ): Promise<CreditoB2B[]> {
    const condiciones: SQL[] = [eq(creditos_b2b.cliente_id, clienteId)];
    if (sucursalId !== undefined) {
      condiciones.push(eq(creditos_b2b.sucursal_id, sucursalId));
    }

    const rows = await this.db
      .select({
        credito: creditos_b2b,
        facturaConsecutivo: facturas.consecutivo,
        clienteNombre: clientes.nombre_razon_social,
      })
      .from(creditos_b2b)
      .innerJoin(facturas, eq(creditos_b2b.factura_id, facturas.id_factura))
      .innerJoin(clientes, eq(creditos_b2b.cliente_id, clientes.id_cliente))
      .where(and(...condiciones))
      .orderBy(desc(creditos_b2b.fecha_emision));

    return rows.map((r) => this.mapCredito(r.credito, r.facturaConsecutivo, r.clienteNombre));
  }

  public async listarAbonosPorCliente(
    clienteId: string,
    limite = 30,
  ): Promise<AbonoCreditoDto[]> {
    const rows = await this.db
      .select({
        abono: abonos_credito_b2b,
        empleadoNombre: empleados.nombre,
        usuarioEmail: usuarios.email,
      })
      .from(abonos_credito_b2b)
      .innerJoin(creditos_b2b, eq(abonos_credito_b2b.credito_id, creditos_b2b.id_credito))
      .leftJoin(usuarios, eq(abonos_credito_b2b.registrado_por, usuarios.id_usuario))
      .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
      .where(eq(creditos_b2b.cliente_id, clienteId))
      .orderBy(desc(abonos_credito_b2b.fecha))
      .limit(limite);

    return rows.map((r) => ({
      id: r.abono.id_abono,
      creditoId: r.abono.credito_id,
      monto: Number(r.abono.monto),
      fecha: r.abono.fecha.toISOString(),
      registradoPor: r.abono.registrado_por,
      registradoPorNombre: r.empleadoNombre ?? r.usuarioEmail ?? null,
      avisoId: r.abono.aviso_id ?? null,
    }));
  }

  public async existeAvisoPendienteConReferencia(
    creditoId: string,
    referencia: string,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(avisos_pago_credito_b2b)
      .where(
        and(
          eq(avisos_pago_credito_b2b.credito_id, creditoId),
          eq(avisos_pago_credito_b2b.referencia, referencia),
          eq(avisos_pago_credito_b2b.estado, 'pendiente'),
        ),
      );
    return Number(row?.total ?? 0) > 0;
  }

  public async obtenerAvisoPorId(avisoId: string): Promise<AvisoPagoCreditoDto | null> {
    const [row] = await this.db
      .select({
        aviso: avisos_pago_credito_b2b,
        credito: creditos_b2b,
        facturaConsecutivo: facturas.consecutivo,
        clienteNombre: clientes.nombre_razon_social,
        avisadoEmpleado: avisadorEmpleados.nombre,
        avisadoEmail: avisadorUsuarios.email,
        revisadoEmpleado: revisorEmpleados.nombre,
        revisadoEmail: revisorUsuarios.email,
      })
      .from(avisos_pago_credito_b2b)
      .innerJoin(creditos_b2b, eq(avisos_pago_credito_b2b.credito_id, creditos_b2b.id_credito))
      .innerJoin(facturas, eq(creditos_b2b.factura_id, facturas.id_factura))
      .innerJoin(clientes, eq(creditos_b2b.cliente_id, clientes.id_cliente))
      .leftJoin(avisadorUsuarios, eq(avisos_pago_credito_b2b.avisado_por, avisadorUsuarios.id_usuario))
      .leftJoin(avisadorEmpleados, eq(avisadorUsuarios.empleado_id, avisadorEmpleados.id_empleado))
      .leftJoin(revisorUsuarios, eq(avisos_pago_credito_b2b.revisado_por, revisorUsuarios.id_usuario))
      .leftJoin(revisorEmpleados, eq(revisorUsuarios.empleado_id, revisorEmpleados.id_empleado))
      .where(eq(avisos_pago_credito_b2b.id_aviso, avisoId))
      .limit(1);

    if (!row) return null;
    return this.mapAviso(row);
  }

  public async listarAvisosPago(
    filtros: FiltrosAvisosPago & { sucursalId?: number },
  ): Promise<{ items: AvisoPagoCreditoDto[]; total: number }> {
    const condiciones: SQL[] = [];
    if (filtros.estado) {
      condiciones.push(eq(avisos_pago_credito_b2b.estado, filtros.estado));
    }
    if (filtros.clienteId) {
      condiciones.push(eq(creditos_b2b.cliente_id, filtros.clienteId));
    }
    if (filtros.sucursalId !== undefined) {
      condiciones.push(eq(creditos_b2b.sucursal_id, filtros.sucursalId));
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    const [countRow] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(avisos_pago_credito_b2b)
      .innerJoin(creditos_b2b, eq(avisos_pago_credito_b2b.credito_id, creditos_b2b.id_credito))
      .where(whereClause);
    const total = Number(countRow?.total ?? 0);

    if (total === 0) {
      return { items: [], total: 0 };
    }

    const rows = await this.db
      .select({
        aviso: avisos_pago_credito_b2b,
        credito: creditos_b2b,
        facturaConsecutivo: facturas.consecutivo,
        clienteNombre: clientes.nombre_razon_social,
        avisadoEmpleado: avisadorEmpleados.nombre,
        avisadoEmail: avisadorUsuarios.email,
        revisadoEmpleado: revisorEmpleados.nombre,
        revisadoEmail: revisorUsuarios.email,
      })
      .from(avisos_pago_credito_b2b)
      .innerJoin(creditos_b2b, eq(avisos_pago_credito_b2b.credito_id, creditos_b2b.id_credito))
      .innerJoin(facturas, eq(creditos_b2b.factura_id, facturas.id_factura))
      .innerJoin(clientes, eq(creditos_b2b.cliente_id, clientes.id_cliente))
      .leftJoin(avisadorUsuarios, eq(avisos_pago_credito_b2b.avisado_por, avisadorUsuarios.id_usuario))
      .leftJoin(avisadorEmpleados, eq(avisadorUsuarios.empleado_id, avisadorEmpleados.id_empleado))
      .leftJoin(revisorUsuarios, eq(avisos_pago_credito_b2b.revisado_por, revisorUsuarios.id_usuario))
      .leftJoin(revisorEmpleados, eq(revisorUsuarios.empleado_id, revisorEmpleados.id_empleado))
      .where(whereClause)
      .orderBy(desc(avisos_pago_credito_b2b.fecha_aviso))
      .limit(filtros.limite)
      .offset((filtros.pagina - 1) * filtros.limite);

    return {
      items: rows.map((r) => this.mapAviso(r)),
      total,
    };
  }

  public async contarAvisosPendientesPorClientes(
    clienteIds: string[],
    sucursalId?: number,
  ): Promise<Record<string, number>> {
    if (clienteIds.length === 0) return {};

    const condiciones: SQL[] = [
      inArray(creditos_b2b.cliente_id, clienteIds),
      eq(avisos_pago_credito_b2b.estado, 'pendiente'),
    ];
    if (sucursalId !== undefined) {
      condiciones.push(eq(creditos_b2b.sucursal_id, sucursalId));
    }

    const rows = await this.db
      .select({
        clienteId: creditos_b2b.cliente_id,
        total: sql<number>`COUNT(*)`,
      })
      .from(avisos_pago_credito_b2b)
      .innerJoin(creditos_b2b, eq(avisos_pago_credito_b2b.credito_id, creditos_b2b.id_credito))
      .where(and(...condiciones))
      .groupBy(creditos_b2b.cliente_id);

    const resultado: Record<string, number> = {};
    for (const r of rows) {
      resultado[r.clienteId] = Number(r.total ?? 0);
    }
    return resultado;
  }

  public obtenerRentabilidadPorClientes(
    _clienteIds: string[],
    _sucursalId?: number,
  ): Promise<Record<string, RentabilidadClienteRaw>> {
    return Promise.resolve({});
  }

  public registrarCreditoFactura(_params: {
    facturaId: string;
    clienteId: string;
    sucursalId: number;
    monto: number;
    fechaEmision: Date;
    plazoDias: number;
  }): Promise<CreditoB2B> {
    return Promise.reject(new Error('Implementado en el paso de escritura atómica.'));
  }

  public crearAvisoPago(_params: {
    creditoId: string;
    monto: number;
    referencia: string;
    nota: string | null;
    avisadoPor: string;
  }): Promise<AvisoPagoCreditoDto> {
    return Promise.reject(new Error('Implementado en el paso de escritura atómica.'));
  }

  public registrarAbonoAtomico(
    _params: RegistrarAbonoAtomicoParams,
  ): Promise<RegistrarAbonoAtomicoResult> {
    return Promise.reject(new Error('Implementado en el paso de escritura atómica.'));
  }

  public rechazarAvisoPago(_params: {
    avisoId: string;
    revisadoPor: string;
    motivoRechazo: string;
  }): Promise<AvisoPagoCreditoDto> {
    return Promise.reject(new Error('Implementado en el paso de escritura atómica.'));
  }

  private mapCredito(
    row: typeof creditos_b2b.$inferSelect,
    facturaConsecutivo: number,
    clienteNombre: string,
  ): CreditoB2B {
    return new CreditoB2B(
      row.id_credito,
      row.factura_id,
      facturaConsecutivo,
      row.cliente_id,
      clienteNombre,
      row.sucursal_id,
      Number(row.monto),
      Number(row.saldo),
      row.fecha_emision,
      row.fecha_vencimiento,
      row.estado as EstadoCreditoPersistido,
      row.created_at,
    );
  }

  private mapAviso(row: {
    aviso: typeof avisos_pago_credito_b2b.$inferSelect;
    credito: typeof creditos_b2b.$inferSelect;
    facturaConsecutivo: number;
    clienteNombre: string;
    avisadoEmpleado: string | null;
    avisadoEmail: string | null;
    revisadoEmpleado: string | null;
    revisadoEmail: string | null;
  }): AvisoPagoCreditoDto {
    return {
      id: row.aviso.id_aviso,
      creditoId: row.aviso.credito_id,
      facturaId: row.credito.factura_id,
      facturaConsecutivo: row.facturaConsecutivo,
      clienteId: row.credito.cliente_id,
      clienteNombre: row.clienteNombre,
      sucursalId: row.credito.sucursal_id,
      monto: Number(row.aviso.monto),
      saldoActualCredito: Number(row.credito.saldo),
      referencia: row.aviso.referencia,
      nota: row.aviso.nota ?? null,
      estado: row.aviso.estado as EstadoAvisoPago,
      avisadoPor: row.aviso.avisado_por,
      avisadoPorNombre: row.avisadoEmpleado ?? row.avisadoEmail ?? null,
      fechaAviso: row.aviso.fecha_aviso.toISOString(),
      revisadoPor: row.aviso.revisado_por ?? null,
      revisadoPorNombre: row.revisadoEmpleado ?? row.revisadoEmail ?? null,
      fechaRevision: row.aviso.fecha_revision ? row.aviso.fecha_revision.toISOString() : null,
      motivoRechazo: row.aviso.motivo_rechazo ?? null,
    };
  }
}
