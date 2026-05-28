-- ============================================================
--  vistas_campanas.sql — Vistas por campana para ViciTarif
--  Ejecutar: psql -U laclavees12345 -d vicitarif -f vistas_campanas.sql
-- ============================================================

-- ── Vista general: todas las campañas (admin / supervisor) ───
CREATE OR REPLACE VIEW v_campana_todas AS
  SELECT * FROM azteca_registros;

-- ── Vistas automáticas por cada valor de campana en la BD ────
-- Se crean dinámicamente para no tener que editar el archivo
-- cuando se agrega una nueva campana.
DO $$
DECLARE camp TEXT;
BEGIN
  FOR camp IN
    SELECT DISTINCT campana
    FROM azteca_registros
    WHERE campana IS NOT NULL
    ORDER BY campana
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE VIEW v_campana_%s AS
         SELECT * FROM azteca_registros WHERE campana = %L',
      lower(regexp_replace(camp, '[^a-zA-Z0-9]', '_', 'g')),
      camp
    );
    RAISE NOTICE 'Vista creada → v_campana_%',
      lower(regexp_replace(camp, '[^a-zA-Z0-9]', '_', 'g'));
  END LOOP;
END $$;

-- ── Verificar vistas generadas ────────────────────────────────
SELECT viewname AS vista_creada
FROM   pg_views
WHERE  viewname LIKE 'v_campana_%'
ORDER  BY viewname;

-- ============================================================
--  IMPORTANTE: la columna "campana" en "usuarios" debe coincidir
--  con los valores reales de "campana" en azteca_registros:
--
--    Azteca | Dimex | Plata | Sin costo
--
--  Ejemplo:
--    UPDATE usuarios SET campana = 'Azteca'    WHERE username = 'ventas';
--    UPDATE usuarios SET campana = 'Dimex'     WHERE username = 'soporte';
--    UPDATE usuarios SET campana = 'Plata'     WHERE username = 'cobranza';
--    UPDATE usuarios SET campana = NULL        WHERE role IN ('admin','supervisor');
-- ============================================================
