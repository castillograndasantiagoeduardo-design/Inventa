'use client';

import React, { useState } from 'react';
import { formatCOP } from '@/lib/format/moneda';
import type { PuntoSerieTemporalDto } from '../../types/branch-reports.types';
import { Table, Eye, EyeOff } from 'lucide-react';

interface SalesTrendChartProps {
  serie: PuntoSerieTemporalDto[];
  granularidad: 'hora' | 'dia' | 'semana';
  className?: string;
}

export function SalesTrendChart({
  serie,
  granularidad,
  className = '',
}: SalesTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mostrarTabla, setMostrarTabla] = useState<boolean>(false);

  if (serie.length === 0) {
    return (
      <div className={`vidrio rounded-2xl p-6 border border-border text-center ${className}`}>
        <p className="text-sm text-text-muted font-sans">
          No hay transacciones registradas en el período seleccionado.
        </p>
      </div>
    );
  }

  // Dimensiones del SVG
  const width = 760;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 24;
  const paddingY = 24;

  const maxVentas = Math.max(...serie.map((p) => p.totalVentas), 0);
  const maxVal = maxVentas > 0 ? maxVentas * 1.15 : 1000000;

  const getY = (val: number) => {
    const usableHeight = height - paddingY * 2;
    return height - paddingY - (val / maxVal) * usableHeight;
  };

  const divisor = Math.max(serie.length - 1, 1);
  const getX = (idx: number) => {
    if (serie.length === 1) return width / 2;
    const usableWidth = width - paddingLeft - paddingRight;
    return paddingLeft + (idx / divisor) * usableWidth;
  };

  // Construcción de trayectoria suave Bezier
  const puntos = serie.map((p, idx) => ({ x: getX(idx), y: getY(p.totalVentas) }));
  let linePath = '';
  if (puntos.length === 1) {
    linePath = `M ${puntos[0].x} ${puntos[0].y}`;
  } else if (puntos.length > 1) {
    linePath = `M ${puntos[0].x} ${puntos[0].y}`;
    for (let i = 0; i < puntos.length - 1; i++) {
      const p0 = puntos[i === 0 ? 0 : i - 1];
      const p1 = puntos[i];
      const p2 = puntos[i + 1];
      const p3 = puntos[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const areaPath =
    puntos.length > 1
      ? `${linePath} L ${getX(puntos.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
      : '';

  const hoveredPoint = hoveredIdx !== null ? serie[hoveredIdx] : null;

  return (
    <div className={`vidrio rounded-2xl p-5 border border-border shadow-xs ${className}`}>
      {/* Cabecera de la gráfica */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text font-sans">
            Comportamiento temporal de ventas
          </h3>
          <p className="text-xs text-text-muted font-sans">
            Agrupación por {granularidad === 'hora' ? 'hora' : granularidad === 'dia' ? 'día' : 'semana'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarTabla(!mostrarTabla)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl superficie-control border border-border text-xs text-text hover:text-brand-500 font-sans transition-all"
          aria-label={mostrarTabla ? 'Ocultar tabla de datos' : 'Ver tabla de datos accesible'}
        >
          {mostrarTabla ? <EyeOff className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
          <span>{mostrarTabla ? 'Ocultar tabla' : 'Ver tabla de apoyo'}</span>
        </button>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label="Gráfico de línea con la tendencia de ventas en el período"
        >
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas de cuadrícula horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - paddingY * 2);
            const val = maxVal * pct;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="currentColor"
                  opacity="0.45"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${Math.round(val / 1000)}k`}
                </text>
              </g>
            );
          })}

          {/* Área sombreada */}
          {areaPath && <path d={areaPath} fill="url(#salesGrad)" />}

          {/* Línea principal */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Puntos de datos y zona interactiva */}
          {serie.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.totalVentas);
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Círculo invisible de interacción táctil/ratón */}
                <circle cx={cx} cy={cy} r="14" fill="transparent" />

                {/* Punto visible */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 3.5}
                  fill="#111827"
                  stroke="#d97706"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all"
                />

                {/* Etiqueta del eje X (reducida si hay muchos puntos) */}
                {(serie.length <= 14 || idx % Math.ceil(serie.length / 10) === 0 || idx === serie.length - 1) && (
                  <text
                    x={cx}
                    y={height - 6}
                    textAnchor="middle"
                    fill="currentColor"
                    opacity={isHovered ? '0.9' : '0.55'}
                    fontSize="10"
                    fontFamily="sans-serif"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip flotante con datos del punto activo */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 pointer-events-none px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-black/90 text-white border border-white/10 text-xs shadow-lg backdrop-blur-md">
            <p className="font-semibold text-brand-400">{hoveredPoint.label}</p>
            <p className="font-mono tabular-nums font-bold">{formatCOP(hoveredPoint.totalVentas)}</p>
            <p className="text-[10px] text-slate-300 font-sans">{hoveredPoint.cantidadFacturas} facturas</p>
          </div>
        )}
      </div>

      {/* Tabla accesible de soporte */}
      {mostrarTabla && (
        <div className="mt-4 pt-4 border-t border-border overflow-x-auto">
          <table className="w-full text-xs font-sans text-left">
            <thead>
              <tr className="border-b border-border/80 text-text-muted uppercase text-[10px] tracking-wider">
                <th className="py-2 px-3">Período</th>
                <th className="py-2 px-3 text-right">Total Vendido</th>
                <th className="py-2 px-3 text-right">Facturas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {serie.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-3 font-sans text-text font-medium">{item.label}</td>
                  <td className="py-2 px-3 text-right text-text tabular-nums">{formatCOP(item.totalVentas)}</td>
                  <td className="py-2 px-3 text-right text-text-muted tabular-nums">{item.cantidadFacturas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
