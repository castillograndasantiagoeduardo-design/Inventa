'use client';

/**
 * auditoriaColumns.tsx — Columnas de la bitácora de auditoría.
 */

import type { DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatFechaHora } from '@/lib/format/fecha';
import type { LogAuditoria } from '../../types';
import { etiquetaAccion, etiquetaEntidad, TONO_ACCION } from './auditoria.etiquetas';

export function columnasAuditoria(onDetalle: (log: LogAuditoria) => void): DataTableColumn<LogAuditoria>[] {
  return [
    { key: 'fecha', header: 'Fecha', render: (l) => <span className="whitespace-nowrap">{formatFechaHora(l.fecha)}</span> },
    {
      key: 'actor',
      header: 'Actor',
      render: (l) => (l.usuarioNombre ? <span className="font-medium text-text">{l.usuarioNombre}</span> : <span className="text-text-muted">Sistema / anónimo</span>),
    },
    { key: 'accion', header: 'Acción', render: (l) => <Badge tone={TONO_ACCION[l.accion] ?? 'neutral'}>{etiquetaAccion(l.accion)}</Badge> },
    {
      key: 'entidad',
      header: 'Entidad',
      render: (l) => (
        <div>
          <p>{etiquetaEntidad(l.entidad)}</p>
          {l.entidadId && (
            <p className="max-w-[180px] truncate text-xs text-text-muted font-mono" title={l.entidadId}>
              {l.entidadId}
            </p>
          )}
        </div>
      ),
    },
    { key: 'ip', header: 'IP', render: (l) => <span className="text-text-muted font-mono text-xs">{l.ip ?? '—'}</span> },
    {
      key: 'detalle',
      header: 'Detalle',
      align: 'right',
      render: (l) => (
        <button
          type="button"
          onClick={() => onDetalle(l)}
          className="min-h-[40px] rounded-lg px-3 text-xs uppercase tracking-wider font-sans font-medium text-brand-600 dark:text-brand-300 hover:bg-brand-500/15 transition-colors cursor-pointer"
        >
          Ver
        </button>
      ),
    },
  ];
}
