-- ============================================================================
-- INVENTA — BASE CENTRAL (multiempresa)
--
-- Una base de datos por empresa (aislamiento total de datos operativos) más
-- esta base central, que solo guarda lo transversal a todas las empresas:
--   - empresas             : qué empresas existen y en qué base vive cada una
--   - directorio_usuarios  : correo -> empresa (para enrutar login y recuperación)
--   - cuentas              : cuentas creadas desde la web (gratuitas/informativas)
--   - planes, plan_permisos: catálogo comercial y tope de permisos de cada plan
--   - suscripciones        : plan vigente de cada empresa (30 días por pago)
--   - pagos                : intentos de pago (pasarela simulada por ahora)
--
-- Idempotente: se puede ejecutar varias veces (no borra datos).
-- Ejecutar como un usuario con permiso CREATE:
--   cmd /c "mysql -u root -p < Docs\database\central\INVENTA_CENTRAL_BD.sql"
-- Luego, desde Backend/:  deno task seed:central
-- ============================================================================

CREATE DATABASE IF NOT EXISTS inventa_central
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE inventa_central;

CREATE TABLE IF NOT EXISTS empresas (
    id_empresa  INT NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(150) NOT NULL,
    nit         VARCHAR(30) NULL,
    -- Nombre de la base de datos MySQL con los datos operativos de la empresa.
    db_nombre   VARCHAR(64) NOT NULL,
    estado      VARCHAR(20) NOT NULL DEFAULT 'activa',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_empresa),
    UNIQUE INDEX uq_empresas_db_nombre (db_nombre),
    CONSTRAINT chk_empresas_estado CHECK (estado IN ('aprovisionando', 'activa', 'suspendida')),
    CONSTRAINT chk_empresas_db_nombre CHECK (REGEXP_LIKE(db_nombre, '^[a-z0-9_]{1,64}$'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS directorio_usuarios (
    email       VARCHAR(150) NOT NULL,
    empresa_id  INT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (email),
    INDEX idx_directorio_empresa (empresa_id),
    CONSTRAINT fk_directorio_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cuentas (
    id_cuenta     CHAR(36) NOT NULL DEFAULT (UUID()),
    email         VARCHAR(150) NOT NULL,
    nombre        VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL COLLATE utf8mb4_bin,
    -- NULL mientras la cuenta es gratuita; se llena cuando compra un plan.
    empresa_id    INT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_cuenta),
    UNIQUE INDEX uq_cuentas_email (email),
    CONSTRAINT fk_cuentas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS planes (
    id_plan          VARCHAR(20) NOT NULL,
    nombre           VARCHAR(60) NOT NULL,
    etiqueta         VARCHAR(40) NOT NULL,
    descripcion      VARCHAR(255) NOT NULL,
    -- Precio en centavos de COP (ej. 4900000 = $49.000).
    precio_centavos  BIGINT NOT NULL,
    dias_vigencia    INT NOT NULL DEFAULT 30,
    -- Máximo de sucursales activas (NULL = ilimitadas).
    max_sucursales   INT NULL,
    orden            INT NOT NULL DEFAULT 0,
    activo           TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_plan),
    CONSTRAINT chk_planes_precio CHECK (precio_centavos > 0),
    CONSTRAINT chk_planes_dias CHECK (dias_vigencia > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plan_permisos (
    plan_id         VARCHAR(20) NOT NULL,
    permiso_codigo  VARCHAR(80) NOT NULL,
    PRIMARY KEY (plan_id, permiso_codigo),
    CONSTRAINT fk_plan_permisos_plan FOREIGN KEY (plan_id) REFERENCES planes(id_plan) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pagos (
    id_pago              CHAR(36) NOT NULL DEFAULT (UUID()),
    referencia           VARCHAR(40) NOT NULL,
    cuenta_id            CHAR(36) NOT NULL,
    plan_id              VARCHAR(20) NOT NULL,
    monto_centavos       BIGINT NOT NULL,
    moneda               CHAR(3) NOT NULL DEFAULT 'COP',
    pasarela             VARCHAR(20) NOT NULL DEFAULT 'simulada',
    estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    transaccion_externa  VARCHAR(80) NULL,
    detalle              JSON NULL,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pago),
    UNIQUE INDEX uq_pagos_referencia (referencia),
    INDEX idx_pagos_cuenta (cuenta_id),
    CONSTRAINT fk_pagos_cuenta FOREIGN KEY (cuenta_id) REFERENCES cuentas(id_cuenta) ON DELETE RESTRICT,
    CONSTRAINT fk_pagos_plan FOREIGN KEY (plan_id) REFERENCES planes(id_plan) ON DELETE RESTRICT,
    CONSTRAINT chk_pagos_estado CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'expirado')),
    CONSTRAINT chk_pagos_monto CHECK (monto_centavos > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suscripciones (
    id_suscripcion  CHAR(36) NOT NULL DEFAULT (UUID()),
    empresa_id      INT NOT NULL,
    plan_id         VARCHAR(20) NOT NULL,
    pago_id         CHAR(36) NULL,
    inicia_en       DATETIME NOT NULL,
    vence_en        DATETIME NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_suscripcion),
    UNIQUE INDEX uq_suscripciones_pago (pago_id),
    INDEX idx_suscripciones_empresa_vence (empresa_id, vence_en),
    CONSTRAINT fk_suscripciones_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
    CONSTRAINT fk_suscripciones_plan FOREIGN KEY (plan_id) REFERENCES planes(id_plan) ON DELETE RESTRICT,
    CONSTRAINT fk_suscripciones_pago FOREIGN KEY (pago_id) REFERENCES pagos(id_pago) ON DELETE SET NULL,
    CONSTRAINT chk_suscripciones_rango CHECK (vence_en > inicia_en)
) ENGINE=InnoDB;

-- ─── Catálogo de planes (precios en centavos de COP) ─────────────────────────
INSERT INTO planes (id_plan, nombre, etiqueta, descripcion, precio_centavos, dias_vigencia, max_sucursales, orden) VALUES
  ('almacen',    'Almacén',    'Básico',          'Control de existencias, punto de venta ágil y facturación básica para 1 sede.', 4900000, 30, 1, 1),
  ('tienda',     'Tienda',     'Más popular',     'Gestión comercial integral: caja, facturación B2B, administración de sucursal y logística.', 8900000, 30, 1, 2),
  ('empresario', 'Empresario', 'Multi-sede + IA', 'Gobierno corporativo total: super admin multi-sucursal, auditoría forense y asistente IA.', 15900000, 30, NULL, 3)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), etiqueta = VALUES(etiqueta), descripcion = VALUES(descripcion),
  precio_centavos = VALUES(precio_centavos), dias_vigencia = VALUES(dias_vigencia),
  max_sucursales = VALUES(max_sucursales), orden = VALUES(orden);

-- ─── Tope de permisos por plan (permisos efectivos = rol ∩ plan) ─────────────
DELETE FROM plan_permisos WHERE plan_id IN ('almacen', 'tienda', 'empresario');

-- Almacén: POS + inventario básico
INSERT INTO plan_permisos (plan_id, permiso_codigo) VALUES
  ('almacen', 'facturacion:facturar'),
  ('almacen', 'facturacion:abrir-turno'),
  ('almacen', 'facturacion:alertar-admin'),
  ('almacen', 'facturacion:consultar'),
  ('almacen', 'inventario:leer'),
  ('almacen', 'inventario:escribir'),
  ('almacen', 'inventario:registrar-movimiento'),
  ('almacen', 'inventario:ajustar-stock');

-- Tienda: Almacén + administración de sucursal, personal, B2B, logística y kardex
INSERT INTO plan_permisos (plan_id, permiso_codigo)
  SELECT 'tienda', permiso_codigo FROM plan_permisos WHERE plan_id = 'almacen';
INSERT INTO plan_permisos (plan_id, permiso_codigo) VALUES
  ('tienda', 'inventario:ver-kardex'),
  ('tienda', 'facturacion:anular'),
  ('tienda', 'facturacion:devolucion'),
  ('tienda', 'facturacion:gestionar-clientes'),
  ('tienda', 'caja:cierre-administrativo'),
  ('tienda', 'autenticacion:gestionar-usuarios'),
  ('tienda', 'administracion:gestionar-personal'),
  ('tienda', 'administracion:ver-metricas-sucursal'),
  ('tienda', 'administracion:gestionar-alertas'),
  ('tienda', 'logistica:leer'),
  ('tienda', 'logistica:gestionar-activos'),
  ('tienda', 'logistica:asignar-activos'),
  ('tienda', 'logistica:mantenimiento');

-- Empresario: Tienda + multi-sede, roles, auditoría, métricas globales, salarios e IA
INSERT INTO plan_permisos (plan_id, permiso_codigo)
  SELECT 'empresario', permiso_codigo FROM plan_permisos WHERE plan_id = 'tienda';
INSERT INTO plan_permisos (plan_id, permiso_codigo) VALUES
  ('empresario', 'autenticacion:asignar-roles'),
  ('empresario', 'autenticacion:ver-auditoria'),
  ('empresario', 'administracion:gestionar-sucursales'),
  ('empresario', 'administracion:gestionar-salarios'),
  ('empresario', 'administracion:ver-metricas-globales'),
  ('empresario', 'mcp:consultar'),
  ('empresario', 'mcp:ejecutar-herramientas'),
  ('empresario', 'mcp:herramientas-financieras');
