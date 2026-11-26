/**
 * branch-reports.service.ts — Servicio de cliente para el módulo de Reportes de Admin de Sucursal (Fase 6).
 */

import { IHttpClient, apiClient } from '@/lib/api';
import type {
  ReporteInventarioDto,
  ReporteProductosDto,
  ReporteVentasDto,
} from '../types/branch-reports.types';

export interface IBranchReportsService {
  obtenerReporteVentas(params: {
    desde: string;
    hasta: string;
    sucursalId?: number;
  }): Promise<ReporteVentasDto>;

  obtenerReporteProductos(params: {
    desde: string;
    hasta: string;
    sucursalId?: number;
    orden?: 'ingresos' | 'unidades';
    limite?: number;
    categoriaId?: number;
  }): Promise<ReporteProductosDto>;

  obtenerReporteInventario(params: {
    sucursalId?: number;
    soloBajoMinimo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ReporteInventarioDto>;

  descargarReporteCsv(
    tipo: 'ventas' | 'productos' | 'inventario',
    params: {
      desde?: string;
      hasta?: string;
      sucursalId?: number;
      orden?: 'ingresos' | 'unidades';
      categoriaId?: number;
    },
  ): Promise<void>;
}

export class BranchReportsService implements IBranchReportsService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async obtenerReporteVentas(params: {
    desde: string;
    hasta: string;
    sucursalId?: number;
  }): Promise<ReporteVentasDto> {
    return this.http.get<ReporteVentasDto>('/administracion/reportes/ventas', {
      params,
    });
  }

  public async obtenerReporteProductos(params: {
    desde: string;
    hasta: string;
    sucursalId?: number;
    orden?: 'ingresos' | 'unidades';
    limite?: number;
    categoriaId?: number;
  }): Promise<ReporteProductosDto> {
    return this.http.get<ReporteProductosDto>('/administracion/reportes/productos', {
      params,
    });
  }

  public async obtenerReporteInventario(params: {
    sucursalId?: number;
    soloBajoMinimo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ReporteInventarioDto> {
    return this.http.get<ReporteInventarioDto>('/administracion/reportes/inventario', {
      params,
    });
  }

  public async descargarReporteCsv(
    tipo: 'ventas' | 'productos' | 'inventario',
    params: {
      desde?: string;
      hasta?: string;
      sucursalId?: number;
      orden?: 'ingresos' | 'unidades';
      categoriaId?: number;
    },
  ): Promise<void> {
    const csvTexto = await this.http.get<string>(
      `/administracion/reportes/${tipo}/exportar`,
      { params },
    );

    const blob = new Blob([csvTexto ?? ''], {
      type: 'text/csv;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const ahora = new Date().toISOString().slice(0, 10);
    link.download = `reporte_${tipo}_${params.desde ?? ahora}_${params.hasta ?? ahora}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const branchReportsService = new BranchReportsService();
