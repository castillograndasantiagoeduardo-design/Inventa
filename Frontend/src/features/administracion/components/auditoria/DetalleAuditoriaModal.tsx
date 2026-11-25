'use client';

/**
 * DetalleAuditoriaModal.tsx — Comparación antes / después de un evento de auditoría.
 *
 * El backend guarda `detalles` ya sanitizado (sin contraseñas, hashes, tokens ni secretos).
 * Si el evento no trae { antes, despues } se muestra el detalle completo como JSON.
 */

import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatFechaHora } from '@/lib/format/fecha';
import type { LogAuditoria } from '../../types';
import { etiquetaAccion, etiquetaEntidad, TONO_ACCION } from './auditoria.etiquetas';

type Objeto = Record<string, unknown>;

const esObjeto = (v: unknown): v is Objeto => typeof v === 'object' && v !== null && !Array.isArray(v);
const mostrar = (v: unknown) => (v === undefined ? '—' : typeof v === 'string' ? v : JSON.stringify(v));

function TablaCambios({ antes, despues }: { antes: Objeto; despues: Objeto }) {
  const claves = [...new Set([...Object.keys(antes), ...Object.keys(despues)])];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-text-muted font-sans">
          <tr>
            <th className="py-2 text-left font-medium">Campo</th>
            <th className="py-2 text-left font-medium">Antes</th>
            <th className="py-2 text-left font-medium">Después</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {claves.map((k) => {
            const cambio = mostrar(antes[k]) !== mostrar(despues[k]);
            return (
              <tr key={k} className={cambio ? 'bg-brand-500/8' : ''}>
                <td className="py-2 pr-3 font-medium text-text">{k}</td>
                <td className="py-2 pr-3 break-all text-red-600 dark:text-red-300">{mostrar(antes[k])}</td>
                <td className={`py-2 break-all ${cambio ? 'text-emerald-600 dark:text-emerald-300 font-medium' : 'text-text-muted'}`}>{mostrar(despues[k])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DetalleAuditoriaModal({ log, onClose }: { log: LogAuditoria | null; onClose: () => void }) {
  const detalles = log?.detalles ?? null;
  const antes = esObjeto(detalles?.antes) ? detalles.antes : {};
  const despues = esObjeto(detalles?.despues) ? detalles.despues : {};
  const tieneDiff = Object.keys(antes).length > 0 || Object.keys(despues).length > 0;
  const resto = detalles ? Object.fromEntries(Object.entries(detalles).filter(([k]) => k !== 'antes' && k !== 'despues')) : {};

  return (
    <Modal open={log !== null} onClose={onClose} size="lg" title="Detalle del evento" description={log ? formatFechaHora(log.fecha) : undefined}>
      {log && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge tone={TONO_ACCION[log.accion] ?? 'neutral'}>{etiquetaAccion(log.accion)}</Badge>
            <span className="font-medium text-text">{etiquetaEntidad(log.entidad)}</span>
            {log.entidadId && <code className="rounded-lg superficie-control px-2 py-0.5 text-xs font-mono text-text-muted">{log.entidadId}</code>}
            <span className="text-text-muted">por {log.usuarioNombre ?? 'Sistema / anónimo'}</span>
            {log.ip && <span className="text-text-muted font-mono text-xs">IP {log.ip}</span>}
          </div>

          {tieneDiff ? (
            <TablaCambios antes={antes} despues={despues} />
          ) : (
            <p className="text-sm text-text-muted">Este evento no registra cambios de campos.</p>
          )}

          {Object.keys(resto).length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] uppercase tracking-wider text-text-muted font-sans font-medium">Información adicional</h3>
              <pre className="max-h-60 overflow-auto rounded-xl superficie-control p-3 text-xs font-mono text-text">{JSON.stringify(resto, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
