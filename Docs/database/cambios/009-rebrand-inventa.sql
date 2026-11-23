-- ============================================================================
-- CAMBIO: 009-rebrand-inventa.sql
-- Rebrand Warengine → Inventa: base de datos `inventa` y usuario `inventa_user`.
--
-- Ejecutar como root (o un usuario con CREATE y CREATE USER). Reemplaza
-- '<CAMBIAR>' por la contraseña real y pon la misma en DB_PASSWORD del .env.
--
-- Hay dos caminos:
--   A) Instalación limpia: ejecuta este script y luego Docs/database/INVENTA_FULL_BD.sql
--      (ese script hace DROP/CREATE de `inventa`, así que el CREATE DATABASE de aquí
--      solo importa para el camino B).
--   B) Conservar los datos de `warengine`: ejecuta este script y luego copia los datos
--      con mysqldump (ver abajo). La BD vieja `warengine` NO se borra.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS inventa
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'inventa_user'@'localhost' IDENTIFIED BY '<CAMBIAR>';
GRANT ALL PRIVILEGES ON inventa.* TO 'inventa_user'@'localhost';
FLUSH PRIVILEGES;

-- ----------------------------------------------------------------------------
-- Opcional (producción): usuario de la API con solo SELECT/INSERT en auditoría.
-- Ver 001-logs-auditoria-solo-insercion.sql.
--   CREATE USER IF NOT EXISTS 'inventa_api'@'%' IDENTIFIED BY '<CAMBIAR>';
--   GRANT SELECT, INSERT ON inventa.logs_auditoria TO 'inventa_api'@'%';
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- CAMINO B — Copiar los datos de `warengine` a `inventa` (Windows / PowerShell)
--
-- PowerShell no admite la redirección `<`, por eso la carga se hace con `cmd /c`.
-- Ajusta la ruta de mysql/mysqldump si no están en el PATH, por ejemplo:
--   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" ...
--
-- 1. Exportar `warengine` (estructura, datos, triggers y rutinas, SIN `CREATE DATABASE`
--    ni `USE`, porque se pasa una sola BD sin --databases):
--      cmd /c "mysqldump -u root -p --routines --triggers --single-transaction --set-gtid-purged=OFF warengine > warengine_respaldo.sql"
--
-- 2. Cargar el respaldo dentro de `inventa`:
--      cmd /c "mysql -u root -p inventa < warengine_respaldo.sql"
--
-- 3. Comprobar que coinciden los conteos (ejemplo):
--      mysql -u root -p -e "SELECT COUNT(*) FROM warengine.usuarios; SELECT COUNT(*) FROM inventa.usuarios;"
--
-- 4. Cuando todo funcione con DB_NAME=inventa y DB_USER=inventa_user, puedes borrar
--    lo viejo (irreversible, haz respaldo antes):
--      DROP DATABASE warengine;
--      DROP USER 'warengine_user'@'localhost';
-- ----------------------------------------------------------------------------
