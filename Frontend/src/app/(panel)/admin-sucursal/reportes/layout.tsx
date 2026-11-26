'use client';

import React, { Suspense } from 'react';
import {
  PageHeader,
  SectionTabs,
  REPORTS_SECTION_TABS,
  DateRangeFilter,
} from '@/features/admin-sucursal';

export default function AdminSucursalReportesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* 1. Encabezado de la página */}
      <PageHeader
        title="Reportes"
        description="Analítica de ventas, rendimiento de productos y disponibilidad de inventario de la sede."
      />

      {/* 2. Filtro de fechas compartido en URL */}
      <Suspense fallback={<div className="h-10 rounded-xl bg-white/[0.03] animate-pulse" />}>
        <DateRangeFilter />
      </Suspense>

      {/* 3. Pestañas de sección (Ventas | Productos | Inventario) preservando query */}
      <Suspense fallback={<div className="h-10 rounded-2xl bg-white/[0.03] animate-pulse" />}>
        <SectionTabs
          tabs={REPORTS_SECTION_TABS}
          ariaLabel="Pestañas del módulo de Reportes"
          preserveQuery={true}
        />
      </Suspense>

      {/* 4. Contenido de la pestaña activa */}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
