import type { EstadoCreditoCliente, NivelRiesgoCredito } from '@inventa/contracts';
import type { VarianteInsignia } from '@/components/Insignia';
import type { EstadoAvisoPago, EstadoCarteraB2B } from '../types';

export const BADGE_ESTADO_CREDITO: Record<
  EstadoCreditoCliente,
  { label: string; variante: VarianteInsignia }
> = {
  aprobado: { label: 'Aprobado', variante: 'success' },
  pendiente_aprobacion: { label: 'Pendiente', variante: 'warning' },
  rechazado: { label: 'Rechazado', variante: 'danger' },
  sin_solicitud: { label: 'Sin solicitud', variante: 'neutral' },
};

export const BADGE_RIESGO: Record<
  NivelRiesgoCredito,
  { label: string; variante: VarianteInsignia }
> = {
  bajo: { label: 'Riesgo bajo', variante: 'success' },
  medio: { label: 'Riesgo medio', variante: 'warning' },
  alto: { label: 'Riesgo alto', variante: 'danger' },
};

export const BADGE_ESTADO_CARTERA: Record<
  EstadoCarteraB2B,
  { label: string; variante: VarianteInsignia }
> = {
  vigente: { label: 'Vigente', variante: 'info' },
  pagado: { label: 'Pagado', variante: 'success' },
  en_mora: { label: 'En mora', variante: 'danger' },
};

export const BADGE_ESTADO_AVISO: Record<
  EstadoAvisoPago,
  { label: string; variante: VarianteInsignia }
> = {
  pendiente: { label: 'Pendiente revisión', variante: 'warning' },
  confirmado: { label: 'Confirmado', variante: 'success' },
  rechazado: { label: 'Rechazado', variante: 'danger' },
};
