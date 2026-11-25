import type { RentabilidadClienteRaw } from '../repositories/ICarteraRepository.ts';

export interface ResultadoRentabilidadCliente {
  totalFacturado: number;
  totalDevoluciones: number;
  gananciaGenerada: number;
  /** Ratio gananciaGenerada / cupoCreditoAprobado (ej. 0.25 = 25%). Null si no hay cupo aprobado > 0. */
  rentabilidadSobreCredito: number | null;
}

/**
 * Servicio de dominio puro para calcular la ganancia neta comercial que deja
 * un cliente B2B a la empresa frente al cupo de crédito otorgado.
 *
 * Fórmula de negocio:
 * - Ganancia por ítem = ((precio_unitario - precio_compra) * cantidad - descuento)
 * - Ganancia neta = ganancia de facturas emitidas - ganancia revertida por devoluciones
 * - Rentabilidad sobre crédito = gananciaGenerada / cupoCreditoAprobado
 *
 * Limitación: utiliza el `precio_compra` vigente en catálogo de productos.
 */
export class CalculadorRentabilidadCliente {
  public static calcular(
    raw: Pick<
      RentabilidadClienteRaw,
      'totalFacturado' | 'totalDevoluciones' | 'gananciaBrutaFacturas' | 'gananciaRevertidaDevoluciones'
    > | null | undefined,
    cupoCreditoAprobado: number,
  ): ResultadoRentabilidadCliente {
    if (!raw) {
      return {
        totalFacturado: 0,
        totalDevoluciones: 0,
        gananciaGenerada: 0,
        rentabilidadSobreCredito: null,
      };
    }

    const totalFacturado = Math.round(raw.totalFacturado * 100) / 100;
    const totalDevoluciones = Math.round(raw.totalDevoluciones * 100) / 100;
    const gananciaGenerada =
      Math.round((raw.gananciaBrutaFacturas - raw.gananciaRevertidaDevoluciones) * 100) / 100;

    const rentabilidadSobreCredito =
      cupoCreditoAprobado > 0
        ? Math.round((gananciaGenerada / cupoCreditoAprobado) * 10000) / 10000
        : null;

    return {
      totalFacturado,
      totalDevoluciones,
      gananciaGenerada,
      rentabilidadSobreCredito,
    };
  }
}
