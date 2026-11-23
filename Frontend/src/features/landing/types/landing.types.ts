/**
 * landing.types.ts — Tipos y modelos de datos para la Landing Page de Inventa.
 */

import type { LucideIcon } from 'lucide-react';

/** Secciones navegables de la landing (coinciden con los id de cada <section>). */
export type SeccionLanding = 'inicio' | 'modulos' | 'planes' | 'nosotros';

export interface ModuloData {
  id: string;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
}

export interface PlanData {
  id: string;
  nombre: string;
  /** Precio mensual en COP, ya formateado (es-CO). */
  precio: string;
  etiqueta: string;
  descripcion: string;
  caracteristicas: string[];
  destacado: boolean;
  cta: string;
}
