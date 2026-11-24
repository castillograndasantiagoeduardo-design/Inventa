import type { CreditoB2BDto, EstadoCarteraB2B, EstadoCreditoPersistido } from '@inventa/contracts';

const MS_POR_DIA = 1000 * 60 * 60 * 24;

/**
 * Entidad de dominio que representa una obligación de crédito corporativo B2B
 * originada por una factura emitida con medio de pago `credito_corporativo`.
 *
 * El estado `en_mora` no se persiste: se deriva dinámicamente comparando el
 * saldo pendiente y la fecha de vencimiento contra la fecha de referencia.
 */
export class CreditoB2B {
  constructor(
    public readonly id: string,
    public readonly facturaId: string,
    public readonly facturaConsecutivo: number,
    public readonly clienteId: string,
    public readonly clienteNombre: string,
    public readonly sucursalId: number,
    public readonly monto: number,
    public readonly saldo: number,
    public readonly fechaEmision: Date,
    public readonly fechaVencimiento: Date,
    public readonly estadoPersistido: EstadoCreditoPersistido = 'vigente',
    public readonly createdAt: Date = new Date(),
  ) {}

  /** Indica si la obligación ya fue saldada en su totalidad. */
  public get estaPagado(): boolean {
    return this.saldo <= 0.001 || this.estadoPersistido === 'pagado';
  }

  /** Monto acumulado abonado hasta el momento. */
  public get totalAbonado(): number {
    return Math.max(0, Math.round((this.monto - this.saldo) * 100) / 100);
  }

  /** Indica si el crédito tiene saldo pendiente y su fecha de vencimiento ya pasó. */
  public estaEnMora(referencia: Date = new Date()): boolean {
    if (this.estaPagado) return false;
    return this.fechaVencimiento.getTime() < referencia.getTime();
  }

  /** Estado operativo derivado: `pagado`, `en_mora` o `vigente`. */
  public estadoDerivado(referencia: Date = new Date()): EstadoCarteraB2B {
    if (this.estaPagado) return 'pagado';
    if (this.estaEnMora(referencia)) return 'en_mora';
    return 'vigente';
  }

  /** Días de mora transcurridos desde el vencimiento (0 si no está vencido o está pagado). */
  public diasMora(referencia: Date = new Date()): number {
    if (!this.estaEnMora(referencia)) return 0;
    const diffMs = referencia.getTime() - this.fechaVencimiento.getTime();
    return Math.max(1, Math.floor(diffMs / MS_POR_DIA));
  }

  /** Antigüedad de la obligación en días desde la fecha de emisión. */
  public diasTranscurridos(referencia: Date = new Date()): number {
    const diffMs = referencia.getTime() - this.fechaEmision.getTime();
    return Math.max(0, Math.floor(diffMs / MS_POR_DIA));
  }

  public toDTO(referencia: Date = new Date()): CreditoB2BDto {
    return {
      id: this.id,
      facturaId: this.facturaId,
      facturaConsecutivo: this.facturaConsecutivo,
      clienteId: this.clienteId,
      clienteNombre: this.clienteNombre,
      sucursalId: this.sucursalId,
      monto: this.monto,
      saldo: this.saldo,
      totalAbonado: this.totalAbonado,
      fechaEmision: this.fechaEmision.toISOString(),
      fechaVencimiento: this.fechaVencimiento.toISOString(),
      estado: this.estadoDerivado(referencia),
      diasMora: this.diasMora(referencia),
      diasTranscurridos: this.diasTranscurridos(referencia),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
