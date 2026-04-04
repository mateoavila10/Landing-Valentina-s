-- ─────────────────────────────────────────────────────────
--  Tabla de usuarios para el sistema de login de Valentinas
--  Ejecutar una sola vez en la base de datos de Railway
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario       VARCHAR(100)              NOT NULL UNIQUE,
  password_hash VARCHAR(255)              NOT NULL,
  nombre        VARCHAR(100)              NOT NULL,
  rol           ENUM('admin', 'viewer')   NOT NULL DEFAULT 'viewer',
  created_at    TIMESTAMP                 DEFAULT CURRENT_TIMESTAMP
);
