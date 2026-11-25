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

export interface ICarterasService {
  listarEmpresas(filtros?: FiltrosEmpresasB2B): Promise<ListarEmpresasB2BResponseDto>;
  obtenerEmpresaDetalle(id: string): Promise<EmpresaB2BDetalleDto>;
  listarCartera(filtros?: Partial<FiltrosCarteraB2B>): Promise<ListarCarteraResponseDto>;
  listarMora(): Promise<EmpresaEnMoraDto[]>;
  simularCredito(payload: SimularCreditoB2BInput): Promise<EvaluacionCreditoB2BDto>;
  solicitarCredito(
    clienteId: string,
    payload: SolicitarCreditoB2BInput,
  ): Promise<SolicitarCreditoB2BResponseDto>;
  avisarPago(creditoId: string, payload: AvisarPagoInput): Promise<AvisoPagoCreditoDto>;
  listarAvisosPago(filtros?: Partial<FiltrosAvisosPago>): Promise<ListarAvisosPagoResponseDto>;
  registrarAbonoDirecto(
    creditoId: string,
    payload: RegistrarAbonoCreditoInput,
  ): Promise<RegistrarAbonoCreditoResponseDto>;
  resolverAvisoPago(
    avisoId: string,
    payload: ResolverAvisoInput,
  ): Promise<ResolverAvisoPagoResponseDto>;
}
