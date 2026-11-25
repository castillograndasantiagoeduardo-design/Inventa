-- ==============================================================================
-- CAMBIO 010: Tabla `creditos_b2b` (Obligaciones de Cartera Corporativa B2B)
-- ==============================================================================
-- Qué agrega:
--   Tabla aditiva `creditos_b2b` para registrar una obligación por cada factura
--   emitida con medio de pago `credito_corporativo`, con fecha de vencimiento
--   (fecha_emision + plazo_credito_dias del cliente) y saldo pendiente.
--
-- Por qué:
--   Hasta ahora solo existía el saldo agregado en `clientes`, sin fechas de
--   vencimiento ni trazabilidad por factura para calcular antigüedad o mora.
--   El estado `en_mora` se deriva en dominio/consulta (saldo > 0 y vencimiento < hoy).
--
-- Cómo revertir (Rollback):
--   DROP TABLE IF EXISTS `creditos_b2b`;
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `creditos_b2b` (
  `id_credito`        CHAR(36)       NOT NULL DEFAULT (UUID()),
  `factura_id`        CHAR(36)       NOT NULL,
  `cliente_id`        CHAR(36)       NOT NULL,
  `sucursal_id`       INT            NOT NULL,
  `monto`             DECIMAL(14,2)  NOT NULL,
  `saldo`             DECIMAL(14,2)  NOT NULL,
  `fecha_emision`     DATETIME       NOT NULL,
  `fecha_vencimiento` DATETIME       NOT NULL,
  `estado`            VARCHAR(20)    NOT NULL DEFAULT 'vigente',
  `created_at`        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_credito`),
  UNIQUE KEY `uq_creditos_b2b_factura` (`factura_id`),
  KEY `idx_creditos_b2b_cliente` (`cliente_id`),
  KEY `idx_creditos_b2b_sucursal` (`sucursal_id`),
  KEY `idx_creditos_b2b_estado` (`estado`),
  KEY `idx_creditos_b2b_vencimiento` (`fecha_vencimiento`),
  CONSTRAINT `fk_creditos_b2b_factura`  FOREIGN KEY (`factura_id`)  REFERENCES `facturas` (`id_factura`)   ON DELETE RESTRICT,
  CONSTRAINT `fk_creditos_b2b_cliente`  FOREIGN KEY (`cliente_id`)  REFERENCES `clientes` (`id_cliente`)   ON DELETE RESTRICT,
  CONSTRAINT `fk_creditos_b2b_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id_sucursal`) ON DELETE RESTRICT,
  CONSTRAINT `chk_creditos_b2b_monto`   CHECK (`monto` > 0),
  CONSTRAINT `chk_creditos_b2b_saldo`   CHECK (`saldo` >= 0 AND `saldo` <= `monto`),
  CONSTRAINT `chk_creditos_b2b_fechas`  CHECK (`fecha_vencimiento` >= `fecha_emision`),
  CONSTRAINT `chk_creditos_b2b_estado`  CHECK (`estado` IN ('vigente', 'pagado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
