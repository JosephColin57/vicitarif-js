-- ============================================================
--  ViciTarif — Schema PostgreSQL
--  Ejecutar en tu servidor PostgreSQL:
--    psql -U postgres -d tu_base -f schema.sql
-- ============================================================

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Campañas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campanas (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  tipo        VARCHAR(20)  NOT NULL CHECK (tipo IN ('INBOUND','OUTBOUND','BLENDED')),
  activa      BOOLEAN      NOT NULL DEFAULT true,
  creada_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Agentes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agentes (
  id        SERIAL PRIMARY KEY,
  extension VARCHAR(20)  NOT NULL UNIQUE,
  nombre    VARCHAR(100) NOT NULL,
  equipo    VARCHAR(100),
  activo    BOOLEAN      NOT NULL DEFAULT true
);

-- ── Tarifas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tarifas (
  id                 SERIAL PRIMARY KEY,
  tipo               VARCHAR(20) NOT NULL UNIQUE
                       CHECK (tipo IN ('local','larga_dist','celular','voip','internacional')),
  tarifa_por_min     NUMERIC(10,4) NOT NULL DEFAULT 0,
  mult_fuera_horario NUMERIC(5,2)  NOT NULL DEFAULT 0.20,
  vigente_desde      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── Llamadas (tabla principal) ───────────────────────────────
CREATE TABLE IF NOT EXISTS llamadas (
  id            SERIAL PRIMARY KEY,
  agente_id     INT          REFERENCES agentes(id)  ON DELETE SET NULL,
  campana_id    INT          REFERENCES campanas(id) ON DELETE SET NULL,
  fecha_hora    TIMESTAMP    NOT NULL,
  numero_destino VARCHAR(50),
  tipo          VARCHAR(20)  NOT NULL DEFAULT 'local'
                  CHECK (tipo IN ('local','larga_dist','celular','voip','internacional')),
  direccion     VARCHAR(10)  NOT NULL DEFAULT 'OUTBOUND'
                  CHECK (direccion IN ('INBOUND','OUTBOUND')),
  duracion_seg  INT          NOT NULL DEFAULT 0,
  costo         NUMERIC(10,4) NOT NULL DEFAULT 0,
  estado        VARCHAR(20)  NOT NULL DEFAULT 'ok'
                  CHECK (estado IN ('ok','drop','busy','no_answer'))
);

-- Índices para las queries del dashboard (filtros por fecha y campaña)
CREATE INDEX IF NOT EXISTS idx_llamadas_fecha     ON llamadas (DATE(fecha_hora));
CREATE INDEX IF NOT EXISTS idx_llamadas_campana   ON llamadas (campana_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_agente    ON llamadas (agente_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_fecha_dir ON llamadas (DATE(fecha_hora), direccion);

-- ── KPIs diarios (tabla resumen pre-calculada) ───────────────
-- Se llena con un job diario para que el dashboard sea rápido
CREATE TABLE IF NOT EXISTS kpis_diarios (
  id               SERIAL PRIMARY KEY,
  fecha            DATE         NOT NULL,
  campana_id       INT          REFERENCES campanas(id) ON DELETE CASCADE,
  total_llamadas   INT          NOT NULL DEFAULT 0,
  llamadas_perdidas INT         NOT NULL DEFAULT 0,
  costo_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
  aht_seg          INT          NOT NULL DEFAULT 0,
  drop_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  UNIQUE (fecha, campana_id)
);

CREATE INDEX IF NOT EXISTS idx_kpis_fecha ON kpis_diarios (fecha);

-- ── Usuarios del sistema (para el login JWT) ─────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'supervisor'
                  CHECK (rol IN ('admin','supervisor')),
  nombre        VARCHAR(100) NOT NULL,
  activo        BOOLEAN      NOT NULL DEFAULT true,
  creado_en     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Datos iniciales ──────────────────────────────────────────

-- Tarifas por defecto
INSERT INTO tarifas (tipo, tarifa_por_min, mult_fuera_horario) VALUES
  ('local',         0.012, 0.20),
  ('larga_dist',    0.045, 0.20),
  ('celular',       0.035, 0.20),
  ('voip',          0.008, 0.20),
  ('internacional', 0.120, 0.20)
ON CONFLICT (tipo) DO NOTHING;

-- Campañas de ejemplo
INSERT INTO campanas (nombre, tipo) VALUES
  ('VENTAS_OUT',  'OUTBOUND'),
  ('SOPORTE_IN',  'INBOUND'),
  ('COBRANZA',    'OUTBOUND'),
  ('RETENCION',   'BLENDED')
ON CONFLICT (nombre) DO NOTHING;

-- Usuario admin por defecto (password: admin123)
-- Para regenerar: node -e "require('bcryptjs').hash('tu_pass',10).then(console.log)"
INSERT INTO usuarios (username, password_hash, rol, nombre) VALUES
  ('admin',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPOGKlGlX0m', 'admin',      'Administrador'),
  ('supervisor', '$2a$10$6YL3Ae1NMPfq7B7OhBa5ZOjGm2lQhHj6GdXqg5yZO2tW5VVZZ5q5.', 'supervisor', 'Supervisor TI')
ON CONFLICT (username) DO NOTHING;

-- ── Vista útil para el dashboard ────────────────────────────
CREATE OR REPLACE VIEW v_llamadas_detalle AS
SELECT
  l.id,
  l.fecha_hora,
  l.numero_destino,
  l.tipo,
  l.direccion,
  l.duracion_seg,
  l.costo,
  l.estado,
  a.extension,
  a.nombre   AS agente_nombre,
  c.nombre   AS campana
FROM llamadas l
LEFT JOIN agentes  a ON a.id = l.agente_id
LEFT JOIN campanas c ON c.id = l.campana_id;

-- ── Función para recalcular KPIs de un día ───────────────────
-- Llamar con: SELECT recalcular_kpis('2026-05-14');
CREATE OR REPLACE FUNCTION recalcular_kpis(p_fecha DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO kpis_diarios (fecha, campana_id, total_llamadas, llamadas_perdidas, costo_total, aht_seg, drop_rate)
  SELECT
    p_fecha,
    campana_id,
    COUNT(*)                                          AS total_llamadas,
    SUM(CASE WHEN estado = 'drop' THEN 1 ELSE 0 END) AS llamadas_perdidas,
    ROUND(SUM(costo)::NUMERIC, 2)                     AS costo_total,
    ROUND(AVG(duracion_seg))                          AS aht_seg,
    ROUND((SUM(CASE WHEN estado='drop' THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*),0)) * 100, 1) AS drop_rate
  FROM llamadas
  WHERE DATE(fecha_hora) = p_fecha
  GROUP BY campana_id
  ON CONFLICT (fecha, campana_id) DO UPDATE SET
    total_llamadas    = EXCLUDED.total_llamadas,
    llamadas_perdidas = EXCLUDED.llamadas_perdidas,
    costo_total       = EXCLUDED.costo_total,
    aht_seg           = EXCLUDED.aht_seg,
    drop_rate         = EXCLUDED.drop_rate;
END;
$$ LANGUAGE plpgsql;