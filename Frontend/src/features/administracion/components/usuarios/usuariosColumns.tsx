'use client';

/**
 * usuariosColumns.tsx — Columnas de la tabla de usuarios. Cada acción se muestra solo
 * si la sesión tiene el permiso de su ruta (cambiar rol → asignar-roles; resto → gestionar-usuarios).
 */

import type { DataTableColumn } from '@/components/ui/DataTable';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { etiquetaRol } from '@/lib/format/rol';
import type { UsuarioGestionado } from '../../types';

interface Opciones {
  puedeAsignarRoles: boolean;
  puedeGestionar: boolean;
  onRol: (u: UsuarioGestionado) => void;
  onSucursales: (u: UsuarioGestionado) => void;
  onPassword: (u: UsuarioGestionado) => void;
  onEstado: (u: UsuarioGestionado) => void;
}

const TONO_ROL: Record<string, BadgeTone> = {
  'super-admin': 'gold',
  'admin-sucursal': 'info',
  cajero: 'neutral',
  'vendedor-b2b': 'neutral',
};

const BTN = 'min-h-[40px] rounded-lg px-2.5 text-xs uppercase tracking-wider font-sans font-medium transition-colors cursor-pointer';

export function columnasUsuarios(o: Opciones): DataTableColumn<UsuarioGestionado>[] {
  return [
    {
      key: 'nombre',
      header: 'Usuario',
      render: (u) => (
        <div>
          <p className="font-medium text-text">{u.nombre}</p>
          <p className="text-xs text-text-muted">{u.email}</p>
        </div>
      ),
    },
    { key: 'rol', header: 'Rol', render: (u) => <Badge tone={TONO_ROL[u.rolNombre] ?? 'neutral'}>{etiquetaRol(u.rolNombre)}</Badge> },
    {
      key: 'sucursal',
      header: 'Sucursal(es)',
      render: (u) => (
        <div>
          <p>{u.sucursalNombre}</p>
          {u.sucursalesAdicionales?.length > 0 && (
            <p className="text-xs text-text-muted" title={u.sucursalesAdicionales.map((s) => s.nombre).join(', ')}>
              + {u.sucursalesAdicionales.length} adicional{u.sucursalesAdicionales.length > 1 ? 'es' : ''}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (u) => <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (u) => (
        <div className="flex flex-wrap justify-end gap-1">
          {o.puedeAsignarRoles && (
            <button type="button" onClick={() => o.onRol(u)} className={`${BTN} text-brand-600 dark:text-brand-300 hover:bg-brand-500/15`}>
              Rol
            </button>
          )}
          {o.puedeGestionar && (
            <>
              <button type="button" onClick={() => o.onSucursales(u)} className={`${BTN} text-sky-600 dark:text-sky-300 hover:bg-sky-500/15`}>
                Sedes
              </button>
              <button type="button" onClick={() => o.onPassword(u)} className={`${BTN} text-text-muted hover:bg-slate-900/6 dark:hover:bg-white/10 hover:text-text`}>
                Clave
              </button>
              <button
                type="button"
                onClick={() => o.onEstado(u)}
                className={`${BTN} ${u.isActive ? 'text-red-600 dark:text-red-300 hover:bg-red-500/15' : 'text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/15'}`}
              >
                {u.isActive ? 'Desactivar' : 'Activar'}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];
}
