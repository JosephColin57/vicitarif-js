-- ============================================================
--  recrear_bd_azteca.sql
--  Borra la tabla azteca_registros y la recrea desde cero
--  basado en la estructura real del Excel (26 columnas)
--  Ejecutar: psql -d vicitarif -f recrear_bd_azteca.sql
-- ============================================================

-- 1. Borrar tabla existente (con todos sus índices y dependencias)
DROP TABLE IF EXISTS azteca_registros CASCADE;

-- 2. Crear tabla nueva con estructura completa del Excel
CREATE TABLE azteca_registros (
    -- PK interna
    id              BIGSERIAL PRIMARY KEY,

    -- Col 0: UNIQUEID
    uniqueid        VARCHAR(50),

    -- Col 1: Fecha y hora completa  (ej. 2026-05-21 12:41:59)
    fecha_hora      TIMESTAMP,

    -- Col 2: Fecha  (solo date)
    fecha           DATE,

    -- Col 3: Hora   (solo time)
    hora            TIME,

    -- Col 4: SERVER_IP
    server_ip       VARCHAR(20),

    -- Col 5: TELEFONO  (10 dígitos, almacenado como texto)
    phone_number    VARCHAR(20),

    -- Col 6: PREFIJO
    prefijo         VARCHAR(10),

    -- Col 7: LIST_ID
    list_id         INTEGER,

    -- Col 8: FIRST_NAME  (puede ser ID de cliente en Vicidial)
    first_name      VARCHAR(100),

    -- Col 9: ADDRESS1   (nombre real del cliente)
    address1        VARCHAR(150),

    -- Col 10: ADDRESS2
    address2        VARCHAR(100),

    -- Col 11: ADDRESS3
    address3        VARCHAR(100),

    -- Col 12: CITY
    city            VARCHAR(100),

    -- Col 13: TIEMPO-REAL  (segundos enteros)
    duracion_seg    INTEGER DEFAULT 0,

    -- Col 14: MIN-SEG  (formato MM:SS, se guarda como texto)
    min_seg         VARCHAR(10),

    -- Col 15: REDON-TIEMPO  (minuto redondeado)
    redon_tiempo    SMALLINT DEFAULT 0,

    -- Col 16: CAMPAIGN  (código corto de campaña, ej. CPBAZ)
    campania        VARCHAR(50) DEFAULT 'SIN_CAMPAÑA',

    -- Col 17: AGENTE
    usuario         VARCHAR(80),

    -- Col 18: GRUPO
    grupo           VARCHAR(80),

    -- Col 19: CALL_STATUS  (SDA: 3R, AA, etc.)
    sda             VARCHAR(30),

    -- Col 20: Status  (descripción del status)
    status_name     VARCHAR(150),

    -- Col 21: TIPO  (MOVIL / FIJO)
    tipo            VARCHAR(20),

    -- Col 22: RED   (operadora: MOVIL, TELCEL, etc.)
    red             VARCHAR(30),

    -- Col 23: Costo (con espacio al inicio en el Excel original)
    costo_llamada   NUMERIC(10,4) DEFAULT 0,

    -- Col 24: Campana  (nombre largo: Azteca, 2TRATO, etc.)
    campana         VARCHAR(60),

    -- Col 25: Herramienta  (Blaster, Predictivo, etc.)
    herramienta     VARCHAR(30) DEFAULT 'Blaster',

    -- Metadatos de carga
    archivo_origen  VARCHAR(200),
    fila_excel      INTEGER,

    -- Timestamps de auditoría
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 3. Índices
-- Unicidad por archivo + fila (evita duplicados al recargar)
CREATE UNIQUE INDEX idx_azt_archivo_fila
    ON azteca_registros (archivo_origen, fila_excel)
    WHERE fila_excel IS NOT NULL;

-- Consultas por fecha
CREATE INDEX idx_azt_fecha_hora   ON azteca_registros (fecha_hora);
CREATE INDEX idx_azt_fecha        ON azteca_registros (fecha);

-- Consultas por campaña / agente / status
CREATE INDEX idx_azt_campania     ON azteca_registros (campania);
CREATE INDEX idx_azt_campana      ON azteca_registros (campana);
CREATE INDEX idx_azt_usuario      ON azteca_registros (usuario);
CREATE INDEX idx_azt_status       ON azteca_registros (status_name);
CREATE INDEX idx_azt_phone        ON azteca_registros (phone_number);

-- 4. Confirmación
SELECT 'Tabla azteca_registros creada correctamente.' AS resultado;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'azteca_registros'
ORDER BY ordinal_position;