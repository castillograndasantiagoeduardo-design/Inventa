/**
 * planes.data.ts — Catálogo de planes comerciales y suscripciones de Inventa.
 */

import type { PlanData } from '../types/landing.types';

export const PLANES: PlanData[] = [
  {
    id: 'almacen',
    nombre: 'Almacén',
    precio: '$49.000',
    etiqueta: 'Básico',
    descripcion: 'Control de existencias, punto de venta ágil y facturación básica para 1 sede.',
    caracteristicas: [
      'POS ágil y turnos de caja',
      'Entradas, salidas y stock mínimo',
      'Catálogo y alertas de inventario',
      '1 sucursal / 1 caja activa',
    ],
    destacado: false,
    cta: 'Comprar Almacén',
  },
  {
    id: 'tienda',
    nombre: 'Tienda',
    precio: '$89.000',
    etiqueta: 'Más popular',
    descripcion: 'Gestión comercial integral: caja, facturación B2B, administración de sucursal y logística.',
    caracteristicas: [
      'Todo lo del plan Almacén',
      'Panel Admin Sucursal y personal',
      'Venta B2B a clientes corporativos',
      'Logística y activos fijos',
      'Kardex y traslados de mercancía',
    ],
    destacado: true,
    cta: 'Comprar Tienda',
  },
  {
    id: 'empresario',
    nombre: 'Empresario',
    precio: '$159.000',
    etiqueta: 'Multi-sede + IA',
    descripcion: 'Gobierno corporativo total: super admin multi-sucursal, auditoría forense y asistente IA.',
    caracteristicas: [
      'Todo lo del plan Tienda',
      'Super admin con sedes ilimitadas',
      'Asistente IA con Gemini',
      'Auditoría forense y logs inmutables',
      'Métricas globales y salarios',
    ],
    destacado: false,
    cta: 'Comprar Empresario',
  },
];
