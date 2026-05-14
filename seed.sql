-- ============================================================
--  seed.sql — Datos de prueba para ViciTarif
--  Inserta llamadas para los últimos 7 días
--  Ejecutar: psql -d vicitarif -f seed.sql
-- ============================================================

-- Agentes de prueba
INSERT INTO agentes (extension, nombre, equipo) VALUES
  ('4011', 'Ana García',      'Ventas'),
  ('4012', 'Carlos López',    'Ventas'),
  ('4015', 'María Rodríguez', 'Soporte'),
  ('4018', 'Jorge Martínez',  'Soporte'),
  ('4019', 'Laura Sánchez',   'Cobranza'),
  ('4021', 'Pedro Ramírez',   'Cobranza'),
  ('4022', 'Sofía Torres',    'Retención'),
  ('4025', 'Diego Flores',    'Retención'),
  ('4027', 'Valeria Cruz',    'Ventas'),
  ('4029', 'Andrés Morales',  'Soporte')
ON CONFLICT (extension) DO NOTHING;

-- ── Función para generar llamadas de un día ──────────────────
-- Genera ~80-150 llamadas por día distribuidas entre 08:00 y 19:00

DO $$
DECLARE
  v_fecha     DATE;
  v_dias      INT := 7;       -- cuántos días hacia atrás generar
  v_i         INT;
  v_llamadas  INT;
  v_hora      INT;
  v_min       INT;
  v_agente    INT;
  v_campana   INT;
  v_tipo      VARCHAR;
  v_dir       VARCHAR;
  v_dur       INT;
  v_costo     NUMERIC;
  v_estado    VARCHAR;
  v_destino   VARCHAR;
  v_tipos     VARCHAR[] := ARRAY['local','larga_dist','celular','voip','internacional'];
  v_dirs      VARCHAR[] := ARRAY['INBOUND','OUTBOUND','OUTBOUND','OUTBOUND','INBOUND'];
  v_tarifas   NUMERIC[] := ARRAY[0.012, 0.045, 0.035, 0.008, 0.120];
  v_destinos  VARCHAR[] := ARRAY[
    '555-1234','555-7890','555-2233','800-5566','800-1234',
    '044-5559123','044-3312456','10.5.1.14','10.5.1.22',
    '+52-33-1234','+1-800-1234','555-4321','800-9988'
  ];
  v_idx       INT;
  v_tarifa    NUMERIC;
BEGIN
  FOR v_day IN 0..v_dias LOOP
    v_fecha := CURRENT_DATE - v_day;

    -- Entre 80 y 150 llamadas por día (menos en fines de semana)
    IF EXTRACT(DOW FROM v_fecha) IN (0,6) THEN
      v_llamadas := 40 + (RANDOM() * 40)::INT;
    ELSE
      v_llamadas := 80 + (RANDOM() * 70)::INT;
    END IF;

    FOR v_i IN 1..v_llamadas LOOP
      -- Hora: distribución realista (pico 10-12 y 14-17)
      v_hora := CASE
        WHEN RANDOM() < 0.15 THEN 8  + (RANDOM() * 2)::INT
        WHEN RANDOM() < 0.35 THEN 10 + (RANDOM() * 2)::INT
        WHEN RANDOM() < 0.55 THEN 12 + (RANDOM() * 2)::INT
        WHEN RANDOM() < 0.80 THEN 14 + (RANDOM() * 3)::INT
        ELSE                      17 + (RANDOM() * 2)::INT
      END;
      v_min := (RANDOM() * 59)::INT;

      -- Tipo y tarifa aleatoria
      v_idx    := 1 + (RANDOM() * 4)::INT;
      v_tipo   := v_tipos[v_idx];
      v_tarifa := v_tarifas[v_idx];
      v_dir    := v_dirs[v_idx];

      -- Duración según tipo
      v_dur := CASE v_tipo
        WHEN 'local'         THEN 30  + (RANDOM() * 360)::INT
        WHEN 'larga_dist'    THEN 60  + (RANDOM() * 540)::INT
        WHEN 'celular'       THEN 20  + (RANDOM() * 480)::INT
        WHEN 'voip'          THEN 60  + (RANDOM() * 840)::INT
        WHEN 'internacional' THEN 30  + (RANDOM() * 420)::INT
        ELSE 60
      END;

      -- Costo con multiplicador fuera de horario
      v_costo := ROUND(
        (v_dur / 60.0) * v_tarifa *
        CASE WHEN v_hora < 8 OR v_hora >= 20 THEN 1.20 ELSE 1.0 END,
        4
      );

      -- Estado: 8% drop, 5% busy, 87% ok
      v_estado := CASE
        WHEN RANDOM() < 0.08 THEN 'drop'
        WHEN RANDOM() < 0.05 THEN 'busy'
        ELSE 'ok'
      END;

      v_agente  := 1 + (RANDOM() * 9)::INT;
      v_campana := 1 + (RANDOM() * 3)::INT;
      v_destino := v_destinos[1 + (RANDOM() * 12)::INT];

      INSERT INTO llamadas
        (agente_id, campana_id, fecha_hora, numero_destino, tipo, direccion, duracion_seg, costo, estado)
      VALUES (
        v_agente,
        v_campana,
        v_fecha + (v_hora || ' hours')::INTERVAL + (v_min || ' minutes')::INTERVAL,
        v_destino,
        v_tipo,
        v_dir,
        v_dur,
        v_costo,
        v_estado
      );
    END LOOP;

    -- Recalcular KPIs del día recién insertado
    PERFORM recalcular_kpis(v_fecha);

    RAISE NOTICE 'Día % — % llamadas insertadas', v_fecha, v_llamadas;
  END LOOP;
END $$;

-- Verificar resultados
SELECT
  DATE(fecha_hora)      AS fecha,
  COUNT(*)              AS total_llamadas,
  ROUND(SUM(costo),2)   AS costo_total,
  ROUND(AVG(duracion_seg)) AS aht_seg,
  SUM(CASE WHEN estado='drop' THEN 1 ELSE 0 END) AS drops
FROM llamadas
GROUP BY DATE(fecha_hora)
ORDER BY fecha DESC;