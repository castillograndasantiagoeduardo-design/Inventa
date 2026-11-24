/**
 * pasarela-simulada.ts — Pasarela de pagos de demostración (sin dinero real).
 *
 * Se comporta como una pasarela externa: el cliente "paga" en la página de pago
 * del Frontend y la pasarela registra el resultado de la transacción; el backend
 * luego consulta ese resultado (como haría con Wompi o PayU).
 *
 * Tarjetas de prueba:
 *   4242 4242 4242 4242 → aprobada
 *   4000 0000 0000 0002 → rechazada (fondos insuficientes)
 * Nunca se guarda el número completo ni el CVV: solo los últimos 4 dígitos.
 */

import type { EstadoPago, IPagoRepository, IPasarelaPagos, Pago } from '@inventa/core';

export interface DatosTarjeta {
  numero: string;
  titular: string;
  vencimiento: string; // MM/AA
  cvv: string;
}

export type ResultadoTarjeta =
  | { ok: true; estado: 'aprobado' | 'rechazado'; motivo?: string }
  | { ok: false; error: string };

function luhnValido(digitos: string): boolean {
  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let d = Number(digitos[digitos.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
  }
  return suma % 10 === 0;
}

/** Valida la tarjeta y decide el resultado simulado (función pura, testeable). */
export function evaluarTarjetaSimulada(t: DatosTarjeta, ahora = new Date()): ResultadoTarjeta {
  const numero = t.numero.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(numero) || !luhnValido(numero)) return { ok: false, error: 'El número de tarjeta no es válido.' };
  if (t.titular.trim().length < 3) return { ok: false, error: 'Escribe el nombre del titular.' };
  const venc = /^(\d{2})\/(\d{2})$/.exec(t.vencimiento.trim());
  const mes = venc ? Number(venc[1]) : 0;
  if (!venc || mes < 1 || mes > 12) return { ok: false, error: 'La fecha de vencimiento debe tener el formato MM/AA.' };
  const finDeMes = new Date(Date.UTC(2000 + Number(venc[2]), mes, 1));
  if (finDeMes <= ahora) return { ok: false, error: 'La tarjeta está vencida.' };
  if (!/^\d{3,4}$/.test(t.cvv.trim())) return { ok: false, error: 'El CVV debe tener 3 o 4 dígitos.' };

  if (numero.endsWith('0002')) return { ok: true, estado: 'rechazado', motivo: 'Fondos insuficientes (tarjeta de prueba de rechazo).' };
  return { ok: true, estado: 'aprobado' };
}

export class PasarelaSimulada implements IPasarelaPagos {
  readonly nombre = 'simulada';

  constructor(
    private readonly pagos: IPagoRepository,
    private readonly frontendUrl: string,
  ) {}

  urlDePago(pago: Pago): string {
    return `${this.frontendUrl.replace(/\/$/, '')}/pago/simulado?ref=${encodeURIComponent(pago.referencia)}`;
  }

  /** "Cobra" con la tarjeta y registra la transacción en la pasarela. */
  async cobrar(referencia: string, tarjeta: DatosTarjeta): Promise<ResultadoTarjeta> {
    const resultado = evaluarTarjetaSimulada(tarjeta);
    if (!resultado.ok) return resultado;
    await this.pagos.agregarDetalle(referencia, {
      simulacion: {
        estado: resultado.estado,
        motivo: resultado.motivo ?? null,
        transaccionId: `SIM-${crypto.randomUUID().slice(0, 12).toUpperCase()}`,
        ultimos4: tarjeta.numero.replace(/\D/g, '').slice(-4),
        fecha: new Date().toISOString(),
      },
    });
    return resultado;
  }

  async consultar(referencia: string): Promise<{ estado: EstadoPago; transaccionId: string | null }> {
    const pago = await this.pagos.buscarPorReferencia(referencia);
    const sim = (pago?.detalle as { simulacion?: { estado: EstadoPago; transaccionId: string } } | null)?.simulacion;
    return sim ? { estado: sim.estado, transaccionId: sim.transaccionId } : { estado: 'pendiente', transaccionId: null };
  }
}
