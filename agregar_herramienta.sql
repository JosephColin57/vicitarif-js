-- ============================================================
--  agregar_herramienta.sql
--  1. Agrega columna 'herramienta' a azteca_registros
--  2. Distribuye datos mock entre Predictivo, Blaster e IVR
--
--  Ejecutar: psql -d vicitarif -f agregar_herramienta.sql
-- ============================================================

-- Paso 1 — Agregar columna
ALTER TABLE azteca_registros
  ADD COLUMN IF NOT EXISTS herramienta VARCHAR(20) DEFAULT 'predictivo';

-- Paso 2 — Distribuir los registros existentes entre las 3 herramientas
-- Usamos el modulo del lead_id para repartir de forma determinista

UPDATE azteca_registros SET herramienta =
  CASE
    WHEN MOD(lead_id, 3) = 0 THEN 'predictivo'
    WHEN MOD(lead_id, 3) = 1 THEN 'blaster'
    ELSE                           'ivr'
  END
WHERE herramienta IS NULL OR herramienta = 'predictivo';

-- Ajuste realista por campaña:
-- CPBAZ  → más predictivo y blaster (cobranza activa)
-- IVRB01 → mayoría IVR (automatizado)
UPDATE azteca_registros
SET herramienta = 'ivr'
WHERE campania = 'IVRB01'
  AND MOD(lead_id, 10) < 7;   -- 70% IVR en IVRB01

UPDATE azteca_registros
SET herramienta = 'blaster'
WHERE campania = 'IVRB01'
  AND MOD(lead_id, 10) >= 7;  -- 30% Blaster en IVRB01

UPDATE azteca_registros
SET herramienta = 'predictivo'
WHERE campania = 'CPBAZ'
  AND MOD(lead_id, 2) = 0;    -- 50% Predictivo en CPBAZ

UPDATE azteca_registros
SET herramienta = 'blaster'
WHERE campania = 'CPBAZ'
  AND MOD(lead_id, 2) = 1;    -- 50% Blaster en CPBAZ

-- Paso 3 — Índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_azt_herramienta
  ON azteca_registros (herramienta);

-- Paso 4 — Verificar distribución
SELECT
  herramienta,
  campania,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE sda ILIKE 'ANSWERED%')         AS contestadas,
  COUNT(*) FILTER (WHERE status_name ILIKE '%promesa%') AS promesas
FROM azteca_registros
GROUP BY herramienta, campania
ORDER BY herramienta, campania;
