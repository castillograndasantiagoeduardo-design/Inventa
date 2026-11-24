import { z } from 'zod';

export const PLANES_IDS = ['almacen', 'tienda', 'empresario'] as const;

/** Inicio del checkout de un plan. nombreEmpresa es obligatorio en la primera compra. */
export const iniciarPagoSchema = z.object({
  planId: z.enum(PLANES_IDS, { message: 'Elige un plan válido.' }),
  nombreEmpresa: z.string().trim().min(3, { message: 'El nombre de la empresa debe tener al menos 3 caracteres.' }).max(150).optional(),
  nit: z.string().trim().max(30).optional(),
});

export type IniciarPagoInput = z.infer<typeof iniciarPagoSchema>;

/** Datos de tarjeta para la pasarela simulada (nunca se guardan completos). */
export const pagoSimuladoSchema = z.object({
  numero: z.string().trim().min(13, { message: 'Número de tarjeta incompleto.' }).max(23),
  titular: z.string().trim().min(3, { message: 'Escribe el nombre del titular.' }).max(100),
  vencimiento: z.string().trim().regex(/^\d{2}\/\d{2}$/, { message: 'Usa el formato MM/AA.' }),
  cvv: z.string().trim().regex(/^\d{3,4}$/, { message: 'El CVV debe tener 3 o 4 dígitos.' }),
});

export type PagoSimuladoInput = z.infer<typeof pagoSimuladoSchema>;
