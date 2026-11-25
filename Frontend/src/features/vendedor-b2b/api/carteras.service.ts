/**
 * carteras.service.ts — Servicio HTTP para "Mis empresas", cartera B2B,
 * solicitudes de crédito ("Soltar crédito"), avisos de pago y abonos.
 */

import { type IHttpClient, apiClient } from '@/lib/api';
import type { ICarterasService } from './carteras.service.interface';
import type {
  AvisoPagoCreditoDto,
  AvisarPagoInput,
  EmpresaB2BDetalleDto,
  EmpresaEnMoraDto,
  EvaluacionCreditoB2BDto,
  FiltrosAvisosPago,
  FiltrosCarteraB2B,
  FiltrosEmpresasB2B,
  ListarAvisosPagoResponseDto,
  ListarCarteraResponseDto,
  ListarEmpresasB2BResponseDto,
  RegistrarAbonoCreditoInput,
  RegistrarAbonoCreditoResponseDto,
  ResolverAvisoInput,
  ResolverAvisoPagoResponseDto,
  SimularCreditoB2BInput,
  SolicitarCreditoB2BInput,
  SolicitarCreditoB2BResponseDto,
} from '../types';

export class CarterasService implements ICarterasService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public async listarEmpresas(
    filtros?: FiltrosEmpresasB2B,
  ): Promise<ListarEmpresasB2BResponseDto> {
    const params: Record<string, string | number | boolean> = {};
    if (filtros?.buscar) params.buscar = filtros.buscar;
    if (filtros?.estadoCredito) params.estadoCredito = filtros.estadoCredito;
    if (filtros?.soloEnMora !== undefined) params.soloEnMora = filtros.soloEnMora;
    if (filtros?.conCartera !== undefined) params.conCartera = filtros.conCartera;

    return this.http.get<ListarEmpresasB2BResponseDto>('/ventas/empresas-b2b', { params });
  }

  public async obtenerEmpresaDetalle(id: string): Promise<EmpresaB2BDetalleDto> {
    return this.http.get<EmpresaB2BDetalleDto>(`/ventas/empresas-b2b/${id}`);
  }

  public async listarCartera(
    filtros?: Partial<FiltrosCarteraB2B>,
  ): Promise<ListarCarteraResponseDto> {
    const params: Record<string, string | number> = {
      pagina: filtros?.pagina ?? 1,
      limite: filtros?.limite ?? 20,
    };
    if (filtros?.clienteId) params.clienteId = filtros.clienteId;
    if (filtros?.estado) params.estado = filtros.estado;

    return this.http.get<ListarCarteraResponseDto>('/ventas/cartera-b2b', { params });
  }

  public async listarMora(): Promise<EmpresaEnMoraDto[]> {
    const res = await this.http.get<EmpresaEnMoraDto[]>('/ventas/mora-b2b');
    return Array.isArray(res) ? res : [];
  }

  public async simularCredito(payload: SimularCreditoB2BInput): Promise<EvaluacionCreditoB2BDto> {
    return this.http.post<EvaluacionCreditoB2BDto>('/ventas/clientes/simular-credito', payload);
  }

  public async solicitarCredito(
    clienteId: string,
    payload: SolicitarCreditoB2BInput,
  ): Promise<SolicitarCreditoB2BResponseDto> {
    return this.http.post<SolicitarCreditoB2BResponseDto>(
      `/ventas/clientes/${clienteId}/solicitar-credito`,
      payload,
    );
  }

  public async avisarPago(
    creditoId: string,
    payload: AvisarPagoInput,
  ): Promise<AvisoPagoCreditoDto> {
    return this.http.post<AvisoPagoCreditoDto>(
      `/ventas/creditos-b2b/${creditoId}/avisar-pago`,
      payload,
    );
  }

  public async listarAvisosPago(
    filtros?: Partial<FiltrosAvisosPago>,
  ): Promise<ListarAvisosPagoResponseDto> {
    const params: Record<string, string | number> = {
      pagina: filtros?.pagina ?? 1,
      limite: filtros?.limite ?? 20,
    };
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.clienteId) params.clienteId = filtros.clienteId;

    return this.http.get<ListarAvisosPagoResponseDto>('/ventas/avisos-pago', { params });
  }

  public async registrarAbonoDirecto(
    creditoId: string,
    payload: RegistrarAbonoCreditoInput,
  ): Promise<RegistrarAbonoCreditoResponseDto> {
    return this.http.post<RegistrarAbonoCreditoResponseDto>(
      `/ventas/creditos-b2b/${creditoId}/abonos`,
      payload,
    );
  }

  public async resolverAvisoPago(
    avisoId: string,
    payload: ResolverAvisoInput,
  ): Promise<ResolverAvisoPagoResponseDto> {
    return this.http.put<ResolverAvisoPagoResponseDto>(
      `/ventas/avisos-pago/${avisoId}/resolver`,
      payload,
    );
  }
}

export const carterasService = new CarterasService();
