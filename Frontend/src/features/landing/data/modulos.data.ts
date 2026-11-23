/**
 * modulos.data.ts — Módulos del sistema que se presentan en la landing de Inventa.
 */

import { Package, Receipt, ShoppingCart, Sparkles, Store, Truck } from 'lucide-react';
import type { ModuloData } from '../types/landing.types';

export const MODULOS: ModuloData[] = [
  {
    id: 'pos',
    titulo: 'Punto de venta',
    descripcion: 'Caja rápida, turnos con arqueo, varios medios de pago y comprobantes al instante.',
    icono: ShoppingCart,
  },
  {
    id: 'inventario',
    titulo: 'Inventario multi-almacén',
    descripcion: 'Stock por sucursal, kardex append-only, alertas de stock mínimo e importación masiva.',
    icono: Package,
  },
  {
    id: 'b2b',
    titulo: 'Venta B2B y crédito',
    descripcion: 'Cotizaciones con aval del administrador, cupos de crédito y facturación corporativa.',
    icono: Receipt,
  },
  {
    id: 'sucursal',
    titulo: 'Administración de sucursal',
    descripcion: 'Personal, turnos, alertas y reportes de cada sede, con métricas al día.',
    icono: Store,
  },
  {
    id: 'logistica',
    titulo: 'Logística y activos',
    descripcion: 'Activos fijos, asignaciones y mantenimientos preventivos y correctivos.',
    icono: Truck,
  },
  {
    id: 'auditoria-ia',
    titulo: 'Auditoría y asistente IA',
    descripcion: 'Registro inmutable de cada acción y un asistente que consulta tus datos por ti.',
    icono: Sparkles,
  },
];
