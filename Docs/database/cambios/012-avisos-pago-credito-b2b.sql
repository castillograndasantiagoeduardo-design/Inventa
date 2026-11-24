-- ==============================================================================
-- CAMBIO 012: Tabla `avisos_pago_credito_b2b` (Avisos de Pago de Cartera B2B)
-- ==============================================================================
-- Qué agrega:
--   Tabla aditiva `avisos_pago_credito_b2b` para que el Vendedor B2B reporte
--   pagos realizados por clientes corporativos (con referencia obligatoria y
--   nota opcional) sin modificar saldos hasta la confirmación del Admin.
--
-- Por qué:
--   Separación de funciones: el vendedor B2B avisa el pago (`pendiente`) y el
--   admin de sucursal o super-admin lo confirma (crea abono atómico) o rechaza
--   con motivo.
--
-- Cómo revertir (Rollback):
--   DROP TABLE IF EXISTS `avisos_pago_credito_b2b`;
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `avisos_pago_credito_b2b` (
  `id_aviso`       CHAR(36)       NOT NULL DEFAULT (UUID()),
  `credito_id`     CHAR(36)       NOT NULL,
  `monto`          DECIMAL(14,2)  NOT NULL,
  `referencia`     VARCHAR(100)   NOT NULL,
  `nota`           VARCHAR(300)   NULL,
  `estado`         VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
  `avisado_por`    CHAR(36)       NOT NULL,
  `fecha_aviso`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revisado_por`   CHAR(36)       NULL,
  `fecha_revision` DATETIME       NULL,
  `motivo_rechazo` VARCHAR(300)   NULL,
  PRIMARY KEY (`id_aviso`),
  KEY `idx_avisos_pago_credito` (`credito_id`),
  KEY `idx_avisos_pago_estado` (`estado`),
  KEY `idx_avisos_pago_avisado_por` (`avisado_por`),
  KEY `idx_avisos_pago_credito_ref_estado` (`credito_id`, `referencia`, `estado`),
  CONSTRAINT `fk_avisos_pago_credito`     FOREIGN KEY (`credito_id`)   REFERENCES `creditos_b2b` (`id_credito`) ON DELETE RESTRICT,
  CONSTRAINT `fk_avisos_pago_avisado_por` FOREIGN KEY (`avisado_por`)  REFERENCES `usuarios` (`id_usuario`)   ON DELETE RESTRICT,
  CONSTRAINT `fk_avisos_pago_revisado_por` FOREIGN KEY (`revisado_por`) REFERENCES `usuarios` (`id_usuario`)   ON DELETE SET NULL,
  CONSTRAINT `chk_avisos_pago_monto`      CHECK (`monto` > 0),
  CONSTRAINT `chk_avisos_pago_estado`     CHECK (`estado` IN ('pendiente', 'confirmado', 'rechazado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
