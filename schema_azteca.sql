-- ============================================================
--  schema_azteca.sql — Tabla y vistas para datos de Azteca
--  Ejecutar: psql -d vicitarif -f schema_azteca.sql
-- ============================================================

-- ── Tabla principal de registros Azteca ──────────────────────
CREATE TABLE IF NOT EXISTS azteca_registros (
  id                   SERIAL PRIMARY KEY,
  fecha                DATE          NOT NULL,
  status               VARCHAR(20),
  usuario              VARCHAR(100),
  phone_number         VARCHAR(50)   NOT NULL,
  sda                  VARCHAR(50),
  status_name          VARCHAR(100)  NOT NULL,
  campania             VARCHAR(100)  NOT NULL,
  archivo_origen       VARCHAR(200),            -- nombre del .xlsx cargado
  cargado_en           TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Índices para queries del dashboard
CREATE INDEX IF NOT EXISTS idx_azt_fecha        ON azteca_registros (fecha);
CREATE INDEX IF NOT EXISTS idx_azt_phone        ON azteca_registros (phone_number);
CREATE INDEX IF NOT EXISTS idx_azt_campania     ON azteca_registros (campania);
CREATE INDEX IF NOT EXISTS idx_azt_status_name  ON azteca_registros (status_name);
CREATE INDEX IF NOT EXISTS idx_azt_fecha_camp   ON azteca_registros (fecha, campania);

-- Evitar duplicados al recargar el mismo archivo
CREATE UNIQUE INDEX IF NOT EXISTS idx_azt_unique
  ON azteca_registros (fecha, phone_number, status_name, usuario, archivo_origen);

-- ── Vista: solo números reales (10 dígitos) ──────────────────
CREATE OR REPLACE VIEW v_azteca_numeros AS
SELECT *
FROM azteca_registros
WHERE phone_number ~ '^[0-9]{10}$';

-- ── Vista: solo IDs internos de Vicidial (V...) ──────────────
CREATE OR REPLACE VIEW v_azteca_internos AS
SELECT *
FROM azteca_registros
WHERE phone_number LIKE 'V%';

-- ── Vista: KPIs por día y campaña ────────────────────────────
CREATE OR REPLACE VIEW v_azteca_kpis_diarios AS
SELECT
  fecha,
  campania,
  COUNT(*)                                                          AS total_registros,
  COUNT(*) FILTER (WHERE phone_number ~ '^[0-9]{10}$')             AS total_numeros_reales,
  COUNT(*) FILTER (WHERE phone_number LIKE 'V%')                   AS total_internos,
  COUNT(DISTINCT phone_number)
    FILTER (WHERE phone_number ~ '^[0-9]{10}$')                    AS numeros_unicos,
  COUNT(*) FILTER (WHERE status_name ILIKE '%promesa%')            AS promesas_pago,
  COUNT(*) FILTER (WHERE status_name ILIKE '%pago%'
    AND status_name NOT ILIKE '%promesa%')                         AS pagos_reportados,
  COUNT(*) FILTER (WHERE status_name ILIKE '%no answer%'
    OR status_name ILIKE '%no contesta%')                          AS no_contesta,
  COUNT(*) FILTER (WHERE status_name ILIKE '%answering machine%'   
    OR status_name ILIKE '%buzon%')                                AS buzon,
  COUNT(*) FILTER (WHERE sda ILIKE 'ANSWERED%')                    AS contestadas_sda,
  COUNT(*) FILTER (WHERE sda ILIKE 'NO ANSWER%')                   AS no_answer_sda,
  COUNT(*) FILTER (WHERE sda ILIKE 'FAILED%')                      AS fallidas_sda,
  COUNT(*) FILTER (WHERE sda ILIKE 'BUSY%')                        AS ocupado_sda
FROM azteca_registros
GROUP BY fecha, campania;

-- ── Vista: recurrencia por número ────────────────────────────
CREATE OR REPLACE VIEW v_azteca_recurrencia AS
SELECT
  phone_number,
  COUNT(*)                                AS total_contactos,
  COUNT(DISTINCT fecha)                   AS dias_contactado,
  COUNT(DISTINCT status_name)             AS estados_distintos,
  MIN(fecha)                              AS primer_contacto,
  MAX(fecha)                              AS ultimo_contacto,
  MODE() WITHIN GROUP (ORDER BY status_name) AS status_mas_frecuente,
  MAX(campania)                           AS campania
FROM azteca_registros
WHERE phone_number ~ '^[0-9]{10}$'
GROUP BY phone_number;

-- ── Función para cargar un archivo procesado ─────────────────
-- Se llama desde el script de Python después de procesar el xlsx
CREATE OR REPLACE FUNCTION cargar_azteca_registros(
  p_fecha          DATE,
  p_status         VARCHAR,
  p_usuario        VARCHAR,
  p_phone_number   VARCHAR,
  p_sda            VARCHAR,
  p_status_name    VARCHAR,
  p_campania       VARCHAR,
  p_archivo        VARCHAR
) RETURNS VOID AS $$
BEGIN
  INSERT INTO azteca_registros
    (fecha, status, usuario, phone_number, sda, status_name, campania, archivo_origen)
  VALUES
    (p_fecha, p_status, p_usuario, p_phone_number, p_sda, p_status_name, p_campania, p_archivo)
  ON CONFLICT (fecha, phone_number, status_name, usuario, archivo_origen)
  DO NOTHING;  -- ignora duplicados si se carga el mismo archivo dos veces
END;
$$ LANGUAGE plpgsql;

-- ── Verificación final ────────────────────────────────────────
SELECT 'Schema Azteca creado correctamente' AS resultado;
SELECT tablename FROM pg_tables WHERE tablename IN ('azteca_registros');
SELECT viewname  FROM pg_views  WHERE viewname  LIKE 'v_azteca%';
