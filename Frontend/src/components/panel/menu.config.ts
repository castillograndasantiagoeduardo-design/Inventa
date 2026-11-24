/**
 * menu.config.ts — Entradas del sidebar del panel del Super Admin (/dashboard).
 *
 * Cada entrada declara el permiso RBAC que la habilita (el mismo que exige la ruta
 * de la API que carga esa pantalla); usePanelMenu() filtra según los permisos de la
 * sesión. Para agregar un módulo basta con añadir una entrada aquí y crear la ruta en
 * src/app/(panel)/dashboard/<ruta>/page.tsx.
 */

import { PERMISSIONS } from '@inventa/contracts';

export type PanelMenuIcono = 'inicio' | 'sucursales' | 'usuarios' | 'empleados' | 'auditoria' | 'alertas' | 'cuenta';

export const PANEL_MENU_CATEGORIAS = ['Menú', 'Gestión', 'Control', 'Sistema'] as const;
export type PanelMenuCategoria = (typeof PANEL_MENU_CATEGORIAS)[number];

export interface PanelMenuItem {
  href: string;
  label: string;
  icon: PanelMenuIcono;
  categoria: PanelMenuCategoria;
  /** Permiso requerido; si es un arreglo basta con tener cualquiera. Sin permiso = visible para todos. */
  permiso?: string | string[];
  /** Ruta aún no construida: se muestra deshabilitada con la etiqueta "Pronto". */
  proximamente?: boolean;
}

export const PANEL_MENU: PanelMenuItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'inicio', categoria: 'Menú' },
  { href: '/dashboard/sucursales', label: 'Sucursales', icon: 'sucursales', categoria: 'Gestión', permiso: PERMISSIONS.ADMIN_GESTIONAR_SUCURSALES },
  { href: '/dashboard/usuarios', label: 'Usuarios y roles', icon: 'usuarios', categoria: 'Gestión', permiso: PERMISSIONS.AUTH_MANAGE_USERS },
  { href: '/dashboard/empleados', label: 'Empleados', icon: 'empleados', categoria: 'Gestión', permiso: PERMISSIONS.ADMIN_GESTIONAR_PERSONAL },
  { href: '/dashboard/auditoria', label: 'Auditoría', icon: 'auditoria', categoria: 'Control', permiso: PERMISSIONS.AUTH_VIEW_AUDIT },
  { href: '/dashboard/alertas', label: 'Alertas', icon: 'alertas', categoria: 'Control', permiso: PERMISSIONS.ADMIN_GESTIONAR_ALERTAS },
  { href: '/dashboard/cuenta', label: 'Mi cuenta', icon: 'cuenta', categoria: 'Sistema' },
];
