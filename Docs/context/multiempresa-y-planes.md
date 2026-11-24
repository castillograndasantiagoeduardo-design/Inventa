# Multiempresa, cuentas, planes y pagos

Inventa atiende a varias empresas con **una base de datos por empresa** (aislamiento total)
y una **base central** (`inventa_central`) con lo transversal.

## Cómo funciona

| Pieza | Dónde | Qué hace |
|---|---|---|
| Base central | `Docs/database/central/INVENTA_CENTRAL_BD.sql` | `empresas`, `directorio_usuarios` (correo → empresa), `cuentas`, `planes`, `plan_permisos`, `pagos`, `suscripciones`. |
| Base de cada empresa | `inventa_emp_<id>` | El esquema operativo completo (`INVENTA_FULL_BD.sql` + cambios 002, 007 y 008). La empresa n.º 1 es la base `DB_NAME` original. |
| Contexto por petición | `Backend/packages/database/src/tenancy/` | Cada petición HTTP/MCP corre con la empresa de su JWT (claim `emp`); el `db` de los repositorios se enruta a esa base. **No hay que filtrar por empresa en las consultas.** |
| Tope del plan | `tope-permisos.ts` | Permisos efectivos = permisos del rol ∩ permisos del plan vigente. Sin plan vigente, la empresa queda sin permisos hasta renovar. La empresa n.º 1 no tiene tope. |
| Directorio | `directorio.ts` | Un correo no puede repetirse entre empresas ni con una cuenta de la web; los usuarios nuevos se registran solos. |
| Alta de empresas | `aprovisionador.ts` | Crea la base, siembra roles/permisos, la sede principal y el dueño; si algo falla, lo deshace. |

### Resolución de la empresa de una petición (`empresa.middleware.ts`)
1. Access token válido → claim `emp` firmado.
2. Login y recuperación de contraseña → el correo se busca en el directorio central.
3. Cookie `inventa_emp` (refresh, 2FA, restablecer contraseña).
4. Si nada aplica → empresa por defecto.

## Cuentas, planes y pagos

| Flujo | Detalle |
|---|---|
| Cuenta gratuita | `/registro` crea una cuenta en la base central (sin empresa). Solo ve "Mi cuenta" y los planes. |
| Login unificado | `/auth/login` reconoce cuentas gratuitas (responde `{ tipo: 'CUENTA' }`) y, para los dueños, abre también su sesión de cuenta. |
| Comprar | `/cuenta/comprar?plan=...` → `POST /pagos/checkout` (el monto lo fija el servidor) → pasarela. Sin sesión, pide iniciarla y vuelve. |
| Pasarela | **Simulada** (`platform/src/pagos/pasarela-simulada.ts`): `4242 4242 4242 4242` aprueba, `4000 0000 0000 0002` rechaza. Solo guarda los últimos 4 dígitos. Implementa `IPasarelaPagos`, así que Wompi/PayU serían otro adaptador. |
| Activación | `ConfirmarPagoUseCase` (idempotente): primera compra crea la empresa; renovar el mismo plan suma 30 días al final; cambiar de plan empieza ya. |
| Rol del dueño | Almacén y Tienda → `admin-sucursal`; Empresario → `super-admin`. Al cambiar de plan se ajusta y se revocan sus tokens anteriores. |

### Planes y permisos

| Plan | Precio | Permisos |
|---|---|---|
| Almacén | $49.000 / 30 días | POS (facturar, turnos, alertar, consultar) e inventario (leer, escribir, movimientos, ajustes). |
| Tienda | $89.000 / 30 días | Almacén + kardex, anulaciones, devoluciones, clientes B2B, cierre administrativo, usuarios, personal, métricas de la sede, alertas y logística. |
| Empresario | $159.000 / 30 días | Los 29 permisos: Tienda + roles, auditoría, sucursales, salarios, métricas globales y asistente IA. |

Para cambiar qué incluye un plan basta editar `plan_permisos` en la base central (los permisos se recalculan en ≤ 30 s).

## Puesta en marcha (una vez por equipo)

```powershell
# 1. Base central (idempotente)
cmd /c "mysql -u root -p < Docs\database\central\INVENTA_CENTRAL_BD.sql"
# 2. Registrar tu base actual como empresa n.º 1 y llenar el directorio
cd Backend
deno task seed:central
```

Después de `seed:demo` (o si creas usuarios con SQL directo), vuelve a correr `deno task seed:central`
para que sus correos queden en el directorio.

## Migraciones

Un cambio de esquema operativo debe aplicarse a **todas** las bases `inventa_emp_*` además de la
empresa n.º 1, y agregarse a `ARCHIVOS_ESQUEMA_EMPRESA` (aprovisionador) para las empresas nuevas.

## Pendientes conocidos
- Al vencer un plan no se cambia automáticamente el rol del dueño (sí se le quitan los permisos).
- El resumen del panel de sucursal muestra datos de ejemplo cuando la base está vacía.
- La pasarela es simulada: para cobrar de verdad hay que implementar el adaptador de Wompi o PayU.
