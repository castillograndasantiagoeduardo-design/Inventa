import { z } from 'zod';

/**
 * Logo de la empresa: PNG en base64 (con o sin prefijo data:image/png;base64,).
 * El servidor valida la firma PNG, el tamaño (≤ 1 MB) y las dimensiones.
 */
export const logoPngSchema = z
  .string({ required_error: 'Sube el logo de tu empresa en formato PNG.' })
  .trim()
  .min(60, { message: 'Sube el logo de tu empresa en formato PNG.' })
  .max(1_450_000, { message: 'El logo no puede pesar más de 1 MB.' })
  .refine((v) => !v.startsWith('data:') || v.startsWith('data:image/png;base64,'), {
    message: 'El logo debe ser una imagen PNG.',
  });

export const actualizarLogoSchema = z.object({ logoPng: logoPngSchema });

/** Registro de una cuenta gratuita desde la web (solo informativa hasta comprar un plan). */
export const registroCuentaSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    .max(150),
  email: z
    .string({ required_error: 'El correo es obligatorio.' })
    .trim()
    .toLowerCase()
    .email({ message: 'Ingresa un correo electrónico válido.' })
    .max(150),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
    .max(128, { message: 'La contraseña no puede superar 128 caracteres.' }),
  logoPng: logoPngSchema,
  aceptaTerminos: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones.' }),
  }),
});

export type RegistroCuentaInput = z.infer<typeof registroCuentaSchema>;

/** Plan comercial tal como lo ve el cliente. */
export const planDtoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  etiqueta: z.string(),
  descripcion: z.string(),
  precioCentavos: z.number().int().positive(),
  diasVigencia: z.number().int().positive(),
  maxSucursales: z.number().int().positive().nullable(),
  permisos: z.array(z.string()),
});

export type PlanDto = z.infer<typeof planDtoSchema>;

/** Respuesta de GET /cuentas/yo. */
export interface MiCuentaDto {
  cuenta: { id: string; nombre: string; email: string; empresaId: number | null; colorPrincipal: string | null; logoVersion: string | null };
  suscripcion: { planId: string; planNombre: string; venceEn: string; vigente: boolean } | null;
}
