'use client';

/**
 * SucursalUsuarios.tsx — Usuarios asignados a la sede (principal o adicional).
 */

import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SucursalDetalle } from '../../../types';

type UsuarioAsignado = SucursalDetalle['usuariosAsignados'][number];

const COLUMNAS: DataTableColumn<UsuarioAsignado>[] = [
  {
    key: 'nombre',
    header: 'Nombre',
    render: (u) => (
      <div>
        <p className="font-medium text-text">{u.nombre}</p>
        <p className="text-xs text-text-muted">{u.email}</p>
      </div>
    ),
  },
  { key: 'cargo', header: 'Cargo', render: (u) => u.cargo || <span className="text-text-muted/60">—</span> },
  { key: 'rolNombre', header: 'Rol', render: (u) => <Badge tone="info">{u.rolNombre}</Badge> },
  {
    key: 'esSedePrincipal',
    header: 'Vínculo',
    render: (u) => <Badge tone={u.esSedePrincipal ? 'gold' : 'neutral'}>{u.esSedePrincipal ? 'Sede principal' : 'Adicional'}</Badge>,
  },
  {
    key: 'isActive',
    header: 'Estado',
    render: (u) => <Badge tone={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge>,
  },
];

export function SucursalUsuarios({ usuarios }: { usuarios: UsuarioAsignado[] }) {
  return (
    <section>
      <h2 className="mb-3 font-titulos font-semibold tracking-[-0.005em] text-lg text-text">Personal asignado</h2>
      <DataTable
        caption="Usuarios asignados a la sucursal"
        columns={COLUMNAS}
        rows={usuarios}
        rowKey={(u) => u.id}
        empty={<EmptyState title="Sin personal asignado" description="Asigna usuarios a esta sede desde la gestión de usuarios." />}
      />
    </section>
  );
}
