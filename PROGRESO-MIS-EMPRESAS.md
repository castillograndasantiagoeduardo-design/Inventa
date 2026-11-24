# PROGRESO-MIS-EMPRESAS.md — Sección "Mis empresas" (Vendedor B2B)

> **Rama:** `Actualizaciones` (sin merge a `main`)  
> **Inicio:** 2026-11-24  
> **Objetivo:** Implementar la sección **Mis empresas** en el panel del Vendedor B2B junto con la gestión de cartera, solicitudes de crédito, mora, avisos de pago (vendedor) y confirmación/abonos (admin de sucursal).

---

## 1. Alcance Funcional

1. **Listado de empresas B2B (`Mis empresas`):** cupo aprobado, utilizado, disponible, plazo, estado de crédito, riesgo y ganancia generada frente al crédito otorgado.
2. **Solicitud de crédito ("Soltar crédito"):** carga de datos de ganancia neta mensual, antigüedad y plazo, simulación previa con `EvaluadorCreditoB2B`, y envío a `pendiente_aprobacion`. El vendedor B2B **no** aprueba créditos.
3. **Cartera activa y antigüedad:** listado de créditos B2B (`creditos_b2b`), tiempo pagando, créditos pagados vs. vigentes.
4. **Empresas en mora:** estado derivado (`saldo > 0` y `fecha_vencimiento < hoy`), días de mora y monto vencido.
5. **Flujo de pagos con separación de funciones:**
   - **Vendedor B2B:** solo lectura de cartera + botón **"Avisar pago"** (monto + referencia obligatoria + nota opcional). Queda en `pendiente` y no altera saldo.
   - **Admin de Sucursal / Super Admin:** bandeja de avisos de pago para **confirmar** (crea abono atómico, reduce saldo del crédito y libera cupo del cliente) o **rechazar** (con motivo obligatorio), además de poder registrar **abono directo**.

---

## 2. Reglas de Base de Datos y Arquitectura

- **Regla de Oro de BD:** Prohibido modificar `Docs/database/INVENTA_FULL_BD.sql` o alterar/eliminar tablas existentes (`clientes`, `facturas`, `cotizaciones_b2b`, etc.).
- Todo lo nuevo de BD es aditivo mediante archivos nuevos en `Docs/database/cambios/`:
  - `010-creditos-b2b.sql`
  - `011-abonos-credito-b2b.sql`
  - `012-avisos-pago-credito-b2b.sql`
- Registrados en `Backend/packages/database/src/tenancy/aprovisionador.ts` (`ARCHIVOS_ESQUEMA_EMPRESA`) y documentados en `Docs/database/README.md`.
- Esquema Drizzle nuevo en `Backend/packages/database/src/schema/cartera.schema.ts` sin editar `facturacion.schema.ts`.
- En `packages/core`: prohibido importar Drizzle, Hono, JWT o SQL. Los errores de negocio retornan `Result.fail(new DomainError(...))`.
- Toda mutación audita con `IAuditor` (`{ antes, despues }` solo con campos modificados).
- Operaciones multi-tabla (facturar a crédito, confirmar aviso, registrar abono) van con Unit of Work atómico.

---

## 3. Supuestos, Limitaciones y Notas Previas

1. **Ganancia por empresa:** Se calcula como `SUM((precio_unitario - precio_compra) * cantidad - descuento)` de facturas emitidas no anuladas, restando devoluciones. **Limitación:** utiliza el `precio_compra` vigente del producto (no existe histórico de costo en `factura_items`).
2. **Empresas con crédito previo a la migración:** Si no tienen obligaciones en `creditos_b2b`, se muestran sin cartera y sin inventar fechas.
3. **Soporte de pago:** No hay almacenamiento de archivos; el soporte es la referencia bancaria/recibo + nota opcional.
4. **Baseline previo al inicio:**
   - `deno task check` reporta un error preexistente fuera de alcance en `Backend/apps/api/src/controllers/logistica/activo.controller.ts:23:66` (`categoriaActivoId: number | null | undefined` vs `number | undefined`). No se modifica por estar fuera de alcance.
   - `deno task lint` tiene 235 avisos preexistentes; no se agregarán avisos nuevos.
   - `Result.fail(...)` es la API real de `Result` en `@inventa/shared-kernel` (en `GEMINI.md` se menciona `Result.err`).

---

## 4. Bitácora de Commits

| Fase | Paso | Commit | Descripción | Verificación |
| :--- | :--- | :--- | :--- | :--- |
| Fase 0 | 1 | `695116f` | Crear `PROGRESO-MIS-EMPRESAS.md` | Lectura de docs base y baseline (`deno task test`: 466/466 ok) |
| Fase 0 | 2 | `a4cbed6` | Documentar diseño de cartera B2B en `Docs/modulos/facturacion.md` | Revisión de diseño y reglas de negocio |
| Fase 1 | 3 | `06a5456` | Estados de cartera B2B en `@inventa/contracts` | Export en `index.ts` |
| Fase 1 | 4 | `f15f9ff` | `CreditoB2BDto`, `AbonoCreditoDto` y `registrarAbonoCreditoSchema` | Zod schema + DTOs |
| Fase 1 | 5 | `6a0c8c0` | `EmpresaB2BResumenDto` y `EmpresaB2BDetalleDto` | Contratos de resumen y detalle B2B |
| Fase 1 | 6 | `04276fd` | `SolicitarCreditoB2BInput` con datos de ganancia | Schema Zod `solicitarCreditoB2BSchema` |
| Fase 1 | 7 | `9ecb553` | `ResumenCarteraDto`, `EmpresaEnMoraDto` y filtros de listado | Schemas de filtros y DTOs de resumen |
| Fase 1 | 8 | `c6853fa` | `AvisoPagoCreditoDto`, `AvisarPagoInput` y `ResolverAvisoInput` | Contratos de avisos de pago completos |
| Fase 2 | 9 | `92245cd` | Migración `010-creditos-b2b.sql` | Tabla aditiva con checks e índices |
| Fase 2 | 10 | `429e2f6` | Migración `011-abonos-credito-b2b.sql` | Tabla aditiva + triggers append-only |
| Fase 2 | 11 | `47f9f38` | Migración `012-avisos-pago-credito-b2b.sql` | Tabla aditiva de avisos con checks de estado |
| Fase 2 | 12 | `69c7fa7` | `cartera.schema.ts` con el esquema Drizzle de las tablas nuevas | Export en `schema/index.ts` sin tocar `facturacion.schema.ts` |
| Fase 2 | 13 | `3c4b237` | Registrar 010, 011 y 012 en `aprovisionador.ts` y `Docs/database/README.md` | `tenancy.test.ts` + tablas creadas en BD local |
| Fase 3 | 14 | `8b29b28` | Entidad `CreditoB2B` con estado derivado y días de mora | `credito-b2b.entity.test.ts` |
| Fase 3 | 15 | `3f93e7d` | Puerto `ICarteraRepository` | Contrato de persistencia en `core/` |
| Fase 3 | 16 | `df6a01d` | Servicio puro `CalculadorRentabilidadCliente` + pruebas | `calculador-rentabilidad-cliente.test.ts` (3/3) |
| Fase 3 | 17 | `fce1704` | `ListarEmpresasB2BUseCase` + pruebas | `listar-empresas-b2b.use-case.test.ts` (1/1) |
| Fase 3 | 18 | `b9aa284` | `ObtenerEmpresaB2BDetalleUseCase` + pruebas | `obtener-empresa-b2b-detalle.use-case.test.ts` (2/2) |
| Fase 3 | 19 | `pendiente` | `ListarCarteraUseCase` + pruebas | `listar-cartera.use-case.test.ts` |
