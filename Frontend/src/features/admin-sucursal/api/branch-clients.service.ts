import { IHttpClient, apiClient } from '@/lib/api';
import type {
  ClienteDto,
  ClientesPaginadosDto,
  CrearClienteInput,
  ActualizarClienteInput,
  FiltrosClientesState,
} from '../types/branch-clients.types';
import type {
  AbonoCreditoDto,
  AvisoPagoCreditoDto,
  CreditoB2BDto,
  EstadoAvisoPago,
  FacturaDto,
  RegistrarAbonoCreditoInput,
  ResolverAvisoInput,
} from '@inventa/contracts';

export interface AvisosPagoPaginadosDto {
  items: AvisoPagoCreditoDto[];
  total: number;
  pagina: number;
  limite: number;
}

export interface CarteraB2BClienteDto {
  items: CreditoB2BDto[];
  total: number;
}

export interface IBranchClientsService {
  listarClientes(filtros: FiltrosClientesState): Promise<ClientesPaginadosDto>;
  obtenerCliente(id: string): Promise<ClienteDto>;
  crearCliente(input: CrearClienteInput): Promise<{ cliente: ClienteDto; yaExistia: boolean }>;
  actualizarCliente(id: string, input: ActualizarClienteInput): Promise<ClienteDto>;
  gestionarCredito(id: string, creditoHabilitado: boolean): Promise<ClienteDto>;
  obtenerUltimasFacturas(clienteId: string, limite?: number): Promise<FacturaDto[]>;
  listarAvisosPago(params?: {
    estado?: EstadoAvisoPago;
    clienteId?: string;
    pagina?: number;
    limite?: number;
  }): Promise<AvisosPagoPaginadosDto>;
  resolverAvisoPago(
    avisoId: string,
    payload: ResolverAvisoInput,
  ): Promise<{ decision: 'confirmar' | 'rechazar'; aviso: AvisoPagoCreditoDto }>;
  listarCarteraPendiente(clienteId?: string): Promise<CarteraB2BClienteDto>;
  registrarAbonoCredito(
    creditoId: string,
    payload: RegistrarAbonoCreditoInput,
  ): Promise<{ abono: AbonoCreditoDto; credito: CreditoB2BDto }>;
}

export class BranchClientsService implements IBranchClientsService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async listarClientes(filtros: FiltrosClientesState): Promise<ClientesPaginadosDto> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: filtros.page,
      limite: filtros.limite,
      paginado: true,
      texto: filtros.texto?.trim() || undefined,
      tipoCliente: filtros.tipoCliente || undefined,
      creditoHabilitado: filtros.creditoHabilitado,
      estado: filtros.estado || undefined,
    };

    const res = await this.http.get<ClientesPaginadosDto | ClienteDto[]>('/ventas/clientes', { params });

    if (Array.isArray(res)) {
      return {
        items: res,
        clientes: res,
        total: res.length,
        totalPaginas: 1,
        page: filtros.page,
        limite: filtros.limite,
        resumen: {
          total: res.length,
          b2b: res.filter((c) => c.tipoCliente === 'B2B').length,
          b2c: res.filter((c) => c.tipoCliente === 'B2C').length,
          conCredito: res.filter((c) => c.creditoHabilitado).length,
          saldoPendienteTotal: res.reduce((acc, c) => acc + (c.saldoPendiente || 0), 0),
        },
      };
    }

    return res;
  }

  public async obtenerCliente(id: string): Promise<ClienteDto> {
    return await this.http.get<ClienteDto>(`/ventas/clientes/${id}`);
  }

  public async crearCliente(input: CrearClienteInput): Promise<{ cliente: ClienteDto; yaExistia: boolean }> {
    return await this.http.post<{ cliente: ClienteDto; yaExistia: boolean }>('/ventas/clientes', input);
  }

  public async actualizarCliente(id: string, input: ActualizarClienteInput): Promise<ClienteDto> {
    return await this.http.put<ClienteDto>(`/ventas/clientes/${id}`, input);
  }

  public async gestionarCredito(id: string, creditoHabilitado: boolean): Promise<ClienteDto> {
    return await this.actualizarCliente(id, { creditoHabilitado });
  }

  public async obtenerUltimasFacturas(clienteId: string, limite = 5): Promise<FacturaDto[]> {
    try {
      const res = await this.http.get<{ items?: FacturaDto[]; facturas?: FacturaDto[] } | FacturaDto[]>(
        '/ventas/facturas',
        { params: { clienteId, limite, page: 1 } },
      );
      if (Array.isArray(res)) return res.slice(0, limite);
      return (res.items || res.facturas || []).slice(0, limite);
    } catch {
      return [];
    }
  }

  public async listarAvisosPago(params?: {
    estado?: EstadoAvisoPago;
    clienteId?: string;
    pagina?: number;
    limite?: number;
  }): Promise<AvisosPagoPaginadosDto> {
    const query: Record<string, string | number> = {
      pagina: params?.pagina ?? 1,
      limite: params?.limite ?? 20,
    };
    if (params?.estado) query.estado = params.estado;
    if (params?.clienteId) query.clienteId = params.clienteId;
    return await this.http.get<AvisosPagoPaginadosDto>('/ventas/avisos-pago', { params: query });
  }

  public async resolverAvisoPago(
    avisoId: string,
    payload: ResolverAvisoInput,
  ): Promise<{ decision: 'confirmar' | 'rechazar'; aviso: AvisoPagoCreditoDto }> {
    return await this.http.put<{ decision: 'confirmar' | 'rechazar'; aviso: AvisoPagoCreditoDto }>(
      `/ventas/avisos-pago/${avisoId}/resolver`,
      payload,
    );
  }

  public async listarCarteraPendiente(clienteId?: string): Promise<CarteraB2BClienteDto> {
    const params: Record<string, string | number> = {
      pagina: 1,
      limite: 50,
    };
    if (clienteId) params.clienteId = clienteId;
    const res = await this.http.get<{ items: CreditoB2BDto[]; total: number }>(
      '/ventas/cartera-b2b',
      { params },
    );
    return {
      items: (res.items ?? []).filter((c) => c.estado !== 'pagado' && c.saldo > 0),
      total: res.total ?? 0,
    };
  }

  public async registrarAbonoCredito(
    creditoId: string,
    payload: RegistrarAbonoCreditoInput,
  ): Promise<{ abono: AbonoCreditoDto; credito: CreditoB2BDto }> {
    return await this.http.post<{ abono: AbonoCreditoDto; credito: CreditoB2BDto }>(
      `/ventas/creditos-b2b/${creditoId}/abonos`,
      payload,
    );
  }
}

export const branchClientsService = new BranchClientsService();
