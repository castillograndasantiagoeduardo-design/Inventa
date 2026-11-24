-- ============================================================================
-- CAMBIO CENTRAL 001: marca de la empresa (logo PNG y color principal)
--
-- Solo para bases centrales creadas ANTES de este cambio (las nuevas ya traen
-- estas columnas en INVENTA_CENTRAL_BD.sql). Ejecutar una sola vez:
--   cmd /c "mysql -u root -p inventa_central < Docs\database\central\cambios\001-marca-empresa.sql"
-- ============================================================================

ALTER TABLE cuentas
  ADD COLUMN logo_png        MEDIUMBLOB NULL AFTER empresa_id,
  ADD COLUMN logo_version    CHAR(16)   NULL AFTER logo_png,
  ADD COLUMN color_principal CHAR(7)    NULL AFTER logo_version;

ALTER TABLE empresas
  ADD COLUMN logo_png        MEDIUMBLOB NULL AFTER estado,
  ADD COLUMN logo_version    CHAR(16)   NULL AFTER logo_png,
  ADD COLUMN color_principal CHAR(7)    NULL AFTER logo_version;
