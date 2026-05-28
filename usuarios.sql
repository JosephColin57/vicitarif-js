-- ============================================================
--  usuarios.sql — Tabla de usuarios del sistema ViciTarif
--  Ejecutar: psql -d vicitarif -f usuarios.sql
-- ============================================================

-- ── Recrear tabla limpia ─────────────────────────────────────
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
  id         SERIAL       PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  password   VARCHAR(100) NOT NULL,          -- hash bcrypt
  role       VARCHAR(20)  NOT NULL DEFAULT 'campana', -- admin | supervisor | campana
  nombre     VARCHAR(100) NOT NULL,
  campana    VARCHAR(50)  DEFAULT NULL,      -- solo aplica para role = 'campana'
  activo     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Usuarios iniciales (mismas contraseñas que tenías hardcodeadas) ──
INSERT INTO usuarios (username, password, role, nombre, campana) VALUES
  ('admin',      '$2a$10$/yGOhjhJSN8dFolR9.RsE.kWiqRPt7wsnJsAtBDzqOpn2.ZHLFQk2', 'admin',      'Administrador',       NULL),
  ('supervisor', '$2a$10$fAq2iFFcDRbyZIb8bhbp6uMYftjfHFpoFWtEz0PKGee0vlYSCuf1y', 'supervisor', 'Supervisor TI',       NULL),
  ('ventas',     '$2a$10$LCEQiFshbCKOEn1.itf5TuP91EtolnNw5NjWPvOrr6sPJD.ly5PM6', 'campana',    'Supervisor Ventas',   'VENTAS_OUT'),
  ('soporte',    '$2a$10$HCRJwtDI24DTHgCUy6ZkFeXaBN7cnfLQ/6CRr4pQPnWvkI9aOtj4K', 'campana',    'Supervisor Soporte',  'SOPORTE_IN'),
  ('cobranza',   '$2a$10$4VWamPtKGEuutZn1x/spa.CrD2WT/6ugKU7X67v211meeWtcieMI2', 'campana',    'Supervisor Cobranza', 'COBRANZA')
ON CONFLICT (username) DO NOTHING;

-- ── Cómo agregar un nuevo usuario ────────────────────────────
-- 1. Genera el hash desde Node.js:
--      node -e "const b=require('bcryptjs'); b.hash('TuPassword',10).then(console.log)"
-- 2. Inserta el usuario:
--      INSERT INTO usuarios (username, password, role, nombre, campana)
--      VALUES ('nuevousuario', '<hash>', 'campana', 'Nombre Completo', 'NOMBRE_CAMPANA');

-- ── Cómo desactivar un usuario sin borrarlo ───────────────────
--      UPDATE usuarios SET activo = FALSE WHERE username = 'ventas';

-- ── Ver todos los usuarios ────────────────────────────────────
--      SELECT id, username, role, nombre, campana, activo, created_at FROM usuarios;
