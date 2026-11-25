import { and, desc, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm';
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
import {
  clientes,
  devoluciones_ventas,
  factura_items,
  facturas,
} from '../../schema/facturacion.schema.ts';
import { productos } from '../../schema/inventario.schema.ts';
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

  public async obtenerRentabilidadPorClientes(
    clienteIds: string[],
    sucursalId?: number,
  ): Promise<Record<string, RentabilidadClienteRaw>> {
    if (clienteIds.length === 0) return {};

    const condBase: SQL[] = [
      inArray(facturas.cliente_id, clienteIds),
      eq(facturas.estado, 'emitida'),
      isNull(facturas.deleted_at),
    ];
    if (sucursalId !== undefined) {
      condBase.push(eq(facturas.sucursal_id, sucursalId));
    }

    const [facturadoRows, gananciaRows, devolucionRows] = await Promise.all([
      this.db
        .select({
          clienteId: facturas.cliente_id,
          totalFacturado: sql<number>`COALESCE(SUM(${facturas.total}), 0)`,
        })
        .from(facturas)
        .where(and(...condBase))
        .groupBy(facturas.cliente_id),
      this.db
        .select({
          clienteId: facturas.cliente_id,
          gananciaBruta: sql<number>`COALESCE(SUM((${factura_items.precio_unitario} - COALESCE(${productos.precio_compra}, 0)) * ${factura_items.cantidad} - ${factura_items.descuento}), 0)`,
        })
        .from(factura_items)
        .innerJoin(facturas, eq(factura_items.factura_id, facturas.id_factura))
        .innerJoin(productos, eq(factura_items.producto_id, productos.id_producto))
        .where(and(...condBase, isNull(factura_items.deleted_at)))
        .groupBy(facturas.cliente_id),
      this.db
        .select({
          clienteId: facturas.cliente_id,
          totalDevoluciones: sql<number>`COALESCE(SUM(${devoluciones_ventas.monto_reembolso}), 0)`,
          gananciaRevertida: sql<number>`COALESCE(SUM((${factura_items.precio_unitario} - COALESCE(${productos.precio_compra}, 0)) * ${devoluciones_ventas.cantidad}), 0)`,
        })
        .from(devoluciones_ventas)
        .innerJoin(facturas, eq(devoluciones_ventas.factura_id, facturas.id_factura))
        .innerJoin(
          factura_items,
          eq(devoluciones_ventas.factura_item_id, factura_items.id_factura_item),
        )
        .innerJoin(productos, eq(factura_items.producto_id, productos.id_producto))
        .where(and(...condBase, isNull(devoluciones_ventas.deleted_at)))
        .groupBy(facturas.cliente_id),
    ]);

    const mapa: Record<string, RentabilidadClienteRaw> = {};
    const asegurar = (clienteId: string): RentabilidadClienteRaw => {
      if (!mapa[clienteId]) {
        mapa[clienteId] = {
          clienteId,
          totalFacturado: 0,
          totalDevoluciones: 0,
          gananciaBrutaFacturas: 0,
          gananciaRevertidaDevoluciones: 0,
        };
      }
      return mapa[clienteId];
    };

    for (const r of facturadoRows) {
      asegurar(r.clienteId).totalFacturado = Number(r.totalFacturado ?? 0);
    }
    for (const r of gananciaRows) {
      asegurar(r.clienteId).gananciaBrutaFacturas = Number(r.gananciaBruta ?? 0);
    }
    for (const r of devolucionRows) {
      const entry = asegurar(r.clienteId);
      entry.totalDevoluciones = Number(r.totalDevoluciones ?? 0);
      entry.gananciaRevertidaDevoluciones = Number(r.gananciaRevertida ?? 0);
    }

    return mapa;
  }

  public async registrarCreditoFactura(params: {
    facturaId: string;
    clienteId: string;
    sucursalId: number;
    monto: number;
    fechaEmision: Date;
    plazoDias: number;
  }): Promise<CreditoB2B> {
    const id = crypto.randomUUID();
    const fechaVencimiento = new Date(
      params.fechaEmision.getTime() + params.plazoDias * 86_400_000,
    );
    const montoFijo = Math.round(params.monto * 100) / 100;

    await this.db.insert(creditos_b2b).values({
      id_credito: id,
      factura_id: params.facturaId,
      cliente_id: params.clienteId,
      sucursal_id: params.sucursalId,
      monto: montoFijo.toFixed(2),
      saldo: montoFijo.toFixed(2),
      fecha_emision: params.fechaEmision,
      fecha_vencimiento: fechaVencimiento,
      estado: 'vigente',
    });

    const creado = await this.obtenerCreditoPorId(id);
    if (!creado) {
      throw new Error(`No se pudo recuperar el crédito B2B recién registrado: ${id}`);
    }
    return creado;
  }

  public async crearAvisoPago(params: {
    creditoId: string;
    monto: number;
    referencia: string;
    nota: string | null;
    avisadoPor: string;
  }): Promise<AvisoPagoCreditoDto> {
    const id = crypto.randomUUID();
    await this.db.insert(avisos_pago_credito_b2b).values({
      id_aviso: id,
      credito_id: params.creditoId,
      monto: (Math.round(params.monto * 100) / 100).toFixed(2),
      referencia: params.referencia,
      nota: params.nota,
      estado: 'pendiente',
      avisado_por: params.avisadoPor,
      fecha_aviso: new Date(),
    });

    const creado = await this.obtenerAvisoPorId(id);
    if (!creado) {
      throw new Error(`No se pudo recuperar el aviso de pago recién creado: ${id}`);
    }
    return creado;
  }

  public async registrarAbonoAtomico(
    params: RegistrarAbonoAtomicoParams,
  ): Promise<RegistrarAbonoAtomicoResult> {
    return await this.db.transaction(async (tx) => {
      const [creditoRow] = await tx
        .select()
        .from(creditos_b2b)
        .where(eq(creditos_b2b.id_credito, params.creditoId))
        .for('update');

      if (!creditoRow) {
        throw new Error(`Crédito B2B no encontrado en transacción: ${params.creditoId}`);
      }

      const [clienteRow] = await tx
        .select()
        .from(clientes)
        .where(eq(clientes.id_cliente, params.clienteId))
        .for('update');

      if (!clienteRow) {
        throw new Error(`Cliente no encontrado en transacción: ${params.clienteId}`);
      }

      const [saldoCarteraAntesRow] = await tx
        .select({ totalSaldo: sql<number>`COALESCE(SUM(${creditos_b2b.saldo}), 0)` })
        .from(creditos_b2b)
        .where(eq(creditos_b2b.cliente_id, params.clienteId));

      const saldoActual = Number(creditoRow.saldo);
      const montoAplicado = Math.min(saldoActual, Math.round(params.monto * 100) / 100);
      const nuevoSaldo = Math.max(0, Math.round((saldoActual - montoAplicado) * 100) / 100);
      const nuevoEstado: EstadoCreditoPersistido = nuevoSaldo <= 0.001 ? 'pagado' : 'vigente';
      const ahora = new Date();
      const abonoId = crypto.randomUUID();

      await tx.insert(abonos_credito_b2b).values({
        id_abono: abonoId,
        credito_id: params.creditoId,
        monto: montoAplicado.toFixed(2),
        fecha: ahora,
        registrado_por: params.registradoPor,
        aviso_id: params.avisoId ?? null,
      });

      await tx
        .update(creditos_b2b)
        .set({
          saldo: nuevoSaldo.toFixed(2),
          estado: nuevoEstado,
          updated_at: ahora,
        })
        .where(eq(creditos_b2b.id_credito, params.creditoId));

      if (params.avisoId) {
        const [avisoRes] = await tx
          .update(avisos_pago_credito_b2b)
          .set({
            estado: 'confirmado',
            revisado_por: params.registradoPor,
            fecha_revision: ahora,
          })
          .where(
            and(
              eq(avisos_pago_credito_b2b.id_aviso, params.avisoId),
              eq(avisos_pago_credito_b2b.estado, 'pendiente'),
            ),
          );

        if (Number(avisoRes.affectedRows) === 0) {
          throw new Error(`El aviso de pago ya fue resuelto o no existe: ${params.avisoId}`);
        }
      }

      const cupoUtilizadoAntes = Number(clienteRow.cupo_credito_utilizado ?? 0);
      const cupoUtilizadoDespues = Math.max(
        0,
        Math.round((cupoUtilizadoAntes - montoAplicado) * 100) / 100,
      );

      await tx
        .update(clientes)
        .set({
          cupo_credito_utilizado: cupoUtilizadoDespues.toFixed(2),
        })
        .where(eq(clientes.id_cliente, params.clienteId));

      const [creditoJoined] = await tx
        .select({
          credito: creditos_b2b,
          facturaConsecutivo: facturas.consecutivo,
          clienteNombre: clientes.nombre_razon_social,
        })
        .from(creditos_b2b)
        .innerJoin(facturas, eq(creditos_b2b.factura_id, facturas.id_factura))
        .innerJoin(clientes, eq(creditos_b2b.cliente_id, clientes.id_cliente))
        .where(eq(creditos_b2b.id_credito, params.creditoId))
        .limit(1);

      const [registradorRow] = await tx
        .select({
          empleadoNombre: empleados.nombre,
          usuarioEmail: usuarios.email,
        })
        .from(usuarios)
        .leftJoin(empleados, eq(usuarios.empleado_id, empleados.id_empleado))
        .where(eq(usuarios.id_usuario, params.registradoPor))
        .limit(1);

      const saldoClienteAntes = Number(saldoCarteraAntesRow?.totalSaldo ?? 0);
      const saldoClienteDespues = Math.max(
        0,
        Math.round((saldoClienteAntes - montoAplicado) * 100) / 100,
      );

      return {
        abono: {
          id: abonoId,
          creditoId: params.creditoId,
          monto: montoAplicado,
          fecha: ahora.toISOString(),
          registradoPor: params.registradoPor,
          registradoPorNombre: registradorRow?.empleadoNombre ?? registradorRow?.usuarioEmail ?? null,
          avisoId: params.avisoId ?? null,
        },
        creditoActualizado: this.mapCredito(
          creditoJoined.credito,
          creditoJoined.facturaConsecutivo,
          creditoJoined.clienteNombre,
        ),
        saldoClienteAntes,
        saldoClienteDespues,
        cupoUtilizadoAntes,
        cupoUtilizadoDespues,
      };
    });
  }

  public async rechazarAvisoPago(params: {
    avisoId: string;
    revisadoPor: string;
    motivoRechazo: string;
  }): Promise<AvisoPagoCreditoDto> {
    await this.db
      .update(avisos_pago_credito_b2b)
      .set({
        estado: 'rechazado',
        revisado_por: params.revisadoPor,
        fecha_revision: new Date(),
        motivo_rechazo: params.motivoRechazo,
      })
      .where(
        and(
          eq(avisos_pago_credito_b2b.id_aviso, params.avisoId),
          eq(avisos_pago_credito_b2b.estado, 'pendiente'),
        ),
      );

    const actualizado = await this.obtenerAvisoPorId(params.avisoId);
    if (!actualizado) {
      throw new Error(`No se pudo recuperar el aviso rechazado: ${params.avisoId}`);
    }
    return actualizado;
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
