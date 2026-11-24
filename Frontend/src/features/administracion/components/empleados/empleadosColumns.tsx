'use client';

/**
 * empleadosColumns.tsx — Columnas de la tabla de empleados.
 */

import type { DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatCOP } from '@/lib/format/moneda';
import type { Empleado } from '../../types';

interface Acciones {
  onEditar: (e: Empleado) => void;
  onSalarios?: (e: Empleado) => void;
}

const BTN = 'min-h-[40px] rounded-lg px-3 text-xs uppercase tracking-wider font-sans font-medium transition-colors cursor-pointer';

export function columnasEmpleados({ onEditar, onSalarios }: Acciones): DataTableColumn<Empleado>[] {
  return [
    {
      key: 'nombre',
      header: 'Empleado',
      sortable: true,
      render: (e) => (
        <div>
          <p className="font-medium text-text">{e.nombre}</p>
          <p className="text-xs text-text-muted font-mono">
            {e.tipoDocumento} {e.numeroDocumento}
          </p>
        </div>
      ),
    },
    { key: 'cargo', header: 'Cargo', sortable: true, render: (e) => e.cargo || <span className="text-text-muted/60">—</span> },
    {
      key: 'sucursalNombre',
      header: 'Sucursal / Área',
      sortable: true,
      render: (e) => (
        <div>
          <p>{e.sucursalNombre}</p>
          <p className="text-xs text-text-muted">{e.areaNombre ?? 'Sin área'}</p>
        </div>
      ),
    },
    {
      key: 'sueldoActual',
      header: 'Sueldo',
      sortable: true,
      align: 'right',
      render: (e) => (e.sueldoActual !== null ? <span className="tabular-nums">{formatCOP(e.sueldoActual)}</span> : <span className="text-text-muted/60">—</span>),
    },
    {
      key: 'isActive',
      header: 'Estado',
      sortable: true,
      render: (e) => <Badge tone={e.isActive ? 'success' : 'neutral'}>{e.isActive ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (e) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => onEditar(e)} className={`${BTN} text-brand-600 dark:text-brand-300 hover:bg-brand-500/15`}>
            Editar
          </button>
          {onSalarios && (
            <button type="button" onClick={() => onSalarios(e)} className={`${BTN} text-sky-600 dark:text-sky-300 hover:bg-sky-500/15`}>
              Salario
            </button>
          )}
        </div>
      ),
    },
  ];
}
