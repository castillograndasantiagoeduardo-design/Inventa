-- ==============================================================================
-- CAMBIO 011: Tabla `abonos_credito_b2b` (Abonos Inmutables a Cartera B2B)
-- ==============================================================================
-- Qué agrega:
--   Tabla aditiva `abonos_credito_b2b` para registrar pagos aplicados a un
--   crédito B2B (ya sea por confirmación de aviso o por abono directo del admin),
--   junto con triggers append-only que bloquean UPDATE y DELETE.
--
-- Por qué:
--   Garantizar trazabilidad financiera inmutable de cada abono aplicado a
--   `creditos_b2b`, vinculando opcionalmente `aviso_id` cuando proviene de un
--   aviso de pago del vendedor.
--
-- Cómo revertir (Rollback):
--   DROP TRIGGER IF EXISTS `trg_abonos_credito_b2b_bloquea_update`;
--   DROP TRIGGER IF EXISTS `trg_abonos_credito_b2b_bloquea_delete`;
--   DROP TABLE IF EXISTS `abonos_credito_b2b`;
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `abonos_credito_b2b` (
  `id_abono`       CHAR(36)       NOT NULL DEFAULT (UUID()),
  `credito_id`     CHAR(36)       NOT NULL,
  `monto`          DECIMAL(14,2)  NOT NULL,
  `fecha`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `registrado_por` CHAR(36)       NOT NULL,
  `aviso_id`       CHAR(36)       NULL,
  `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_abono`),
  KEY `idx_abonos_credito_credito` (`credito_id`),
  KEY `idx_abonos_credito_registrado_por` (`registrado_por`),
  KEY `idx_abonos_credito_aviso` (`aviso_id`),
  KEY `idx_abonos_credito_fecha` (`fecha`),
  CONSTRAINT `fk_abonos_credito_credito` FOREIGN KEY (`credito_id`)     REFERENCES `creditos_b2b` (`id_credito`) ON DELETE RESTRICT,
  CONSTRAINT `fk_abonos_credito_usuario` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id_usuario`)   ON DELETE RESTRICT,
  CONSTRAINT `chk_abonos_credito_monto`   CHECK (`monto` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TRIGGER IF EXISTS `trg_abonos_credito_b2b_bloquea_update`;
DROP TRIGGER IF EXISTS `trg_abonos_credito_b2b_bloquea_delete`;

DELIMITER $$

CREATE TRIGGER `trg_abonos_credito_b2b_bloquea_update`
BEFORE UPDATE ON `abonos_credito_b2b`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Los abonos de crédito B2B son inmutables y no pueden modificarse.';
END$$

CREATE TRIGGER `trg_abonos_credito_b2b_bloquea_delete`
BEFORE DELETE ON `abonos_credito_b2b`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Los abonos de crédito B2B son inmutables y no pueden eliminarse.';
END$$

DELIMITER ;
