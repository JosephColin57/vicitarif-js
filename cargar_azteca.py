#!/usr/bin/env python3
# cargar_azteca.py v6 — estructura completa del Excel (26 columnas reales)

import sys, os, re
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime

DB_CONFIG = {
    'host':     os.getenv('DB_HOST', 'localhost'),
    'port':     int(os.getenv('DB_PORT', '5432')),
    'user':     os.getenv('DB_USER', 'laclavees12345'),
    'password': os.getenv('DB_PASS', ''),
    'dbname':   os.getenv('DB_NAME', 'vicitarif'),
}

# ── Índices reales de cada columna del Excel ──────────────────────────
COL_UNIQUEID    = 0   # UNIQUEID
COL_FECHA_HORA  = 1   # Fecha y hora  → TIMESTAMP
COL_FECHA       = 2   # Fecha         → DATE
COL_HORA        = 3   # Hora          → TIME
COL_SERVER_IP   = 4   # SERVER_IP
COL_TELEFONO    = 5   # TELEFONO
COL_PREFIJO     = 6   # PREFIJO
COL_LIST_ID     = 7   # LIST_ID
COL_FIRST_NAME  = 8   # FIRST_NAME
COL_ADDRESS1    = 9   # ADDRESS1
COL_ADDRESS2    = 10  # ADDRESS2
COL_ADDRESS3    = 11  # ADDRESS3
COL_CITY        = 12  # CITY
COL_DURACION    = 13  # TIEMPO-REAL (segundos)
COL_MIN_SEG     = 14  # MIN-SEG (MM:SS)
COL_REDON       = 15  # REDON-TIEMPO
COL_CAMPAIGN    = 16  # CAMPAIGN (código corto)
COL_AGENTE      = 17  # AGENTE
COL_GRUPO       = 18  # GRUPO
COL_CALL_STATUS = 19  # CALL_STATUS (SDA)
COL_STATUS      = 20  # Status (descripción)
COL_TIPO        = 21  # TIPO
COL_RED         = 22  # RED
COL_COSTO       = 23  # Costo  (columna ' Costo' con espacio)
COL_CAMPANA     = 24  # Campana (nombre largo)
COL_HERRAMIENTA = 25  # Herramienta


def limpiar(v):
    """Devuelve None si el valor está vacío, es NaN o es un guión."""
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip()
    return s if s and s not in ('-', 'nan', 'NaN') else None


def cargar_archivo(ruta):
    nombre = os.path.basename(ruta)
    print(f"\n{'='*60}")
    print(f"  Cargando: {nombre}")
    print(f"{'='*60}")

    print("📖 Leyendo archivo Excel...")
    try:
        df = pd.read_excel(ruta, sheet_name='Hoja1', dtype=str)
    except Exception as e:
        print(f"❌ Error leyendo Excel: {e}")
        return False

    total = len(df)
    print(f"   Filas encontradas: {total:,}")

    print("🔄 Procesando filas...")
    registros = []
    omitidos  = 0

    for idx, row in df.iterrows():
        try:
            fila_excel = idx + 2  # +2 porque la fila 1 es el header

            # ── Fecha y hora ──────────────────────────────────────────
            fecha_hora_raw = row.iloc[COL_FECHA_HORA]
            try:
                dt         = pd.to_datetime(fecha_hora_raw)
                fecha_hora = dt.to_pydatetime()
                fecha      = dt.date()
                hora       = dt.time()
            except Exception:
                omitidos += 1
                continue

            # ── Teléfono obligatorio ──────────────────────────────────
            phone = limpiar(row.iloc[COL_TELEFONO])
            if not phone:
                omitidos += 1
                continue
            phone = re.sub(r'\D', '', phone)
            if len(phone) != 10:
                omitidos += 1
                continue

            # ── Campos opcionales ─────────────────────────────────────
            uniqueid    = limpiar(row.iloc[COL_UNIQUEID])
            server_ip   = limpiar(row.iloc[COL_SERVER_IP])
            prefijo     = limpiar(row.iloc[COL_PREFIJO])
            min_seg     = limpiar(row.iloc[COL_MIN_SEG])
            first_name  = limpiar(row.iloc[COL_FIRST_NAME])
            address1    = limpiar(row.iloc[COL_ADDRESS1])
            address2    = limpiar(row.iloc[COL_ADDRESS2])
            address3    = limpiar(row.iloc[COL_ADDRESS3])
            city        = limpiar(row.iloc[COL_CITY])
            agente      = limpiar(row.iloc[COL_AGENTE])
            grupo       = limpiar(row.iloc[COL_GRUPO])
            tipo        = limpiar(row.iloc[COL_TIPO])
            red         = limpiar(row.iloc[COL_RED])
            campana     = limpiar(row.iloc[COL_CAMPANA])
            herramienta = limpiar(row.iloc[COL_HERRAMIENTA]) or 'Blaster'
            campania    = limpiar(row.iloc[COL_CAMPAIGN])    or 'SIN_CAMPAÑA'
            sda         = limpiar(row.iloc[COL_CALL_STATUS])
            status_name = limpiar(row.iloc[COL_STATUS])      or 'SIN_STATUS'

            try:
                list_id = int(float(row.iloc[COL_LIST_ID])) if limpiar(row.iloc[COL_LIST_ID]) else None
            except Exception:
                list_id = None

            try:
                redon = int(float(row.iloc[COL_REDON])) if limpiar(row.iloc[COL_REDON]) else 0
            except Exception:
                redon = 0

            try:
                duracion = int(float(row.iloc[COL_DURACION])) if limpiar(row.iloc[COL_DURACION]) else 0
            except Exception:
                duracion = 0

            try:
                costo = float(row.iloc[COL_COSTO]) if limpiar(row.iloc[COL_COSTO]) else 0.0
            except Exception:
                costo = 0.0

            registros.append((
                uniqueid, fecha_hora, fecha, hora,
                server_ip, phone, prefijo, list_id,
                first_name, address1, address2, address3, city,
                duracion, min_seg, redon,
                campania, agente, grupo,
                sda, status_name, tipo, red,
                costo, campana, herramienta,
                nombre, fila_excel,
            ))

        except Exception as e:
            omitidos += 1
            if omitidos <= 20:
                print(f"   ⚠️  Fila {idx+2} omitida: {e}")

    print(f"   Válidos:  {len(registros):,}")
    print(f"   Omitidos: {omitidos:,}")

    if not registros:
        print("⚠️  Sin registros válidos para insertar.")
        return False

    print("📤 Insertando en PostgreSQL...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor()

        sql = """
            INSERT INTO azteca_registros (
                uniqueid, fecha_hora, fecha, hora,
                server_ip, phone_number, prefijo, list_id,
                first_name, address1, address2, address3, city,
                duracion_seg, min_seg, redon_tiempo,
                campania, usuario, grupo,
                sda, status_name, tipo, red,
                costo_llamada, campana, herramienta,
                archivo_origen, fila_excel
            ) VALUES (
                %s,%s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,%s,%s,
                %s,%s,%s,
                %s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,
                %s,%s
            )
            ON CONFLICT (archivo_origen, fila_excel)
            WHERE fila_excel IS NOT NULL
            DO NOTHING
        """
        execute_batch(cur, sql, registros, page_size=2000)
        conn.commit()

        cur.execute(
            "SELECT COUNT(*), COALESCE(SUM(costo_llamada),0) "
            "FROM azteca_registros WHERE archivo_origen=%s",
            (nombre,)
        )
        total_bd, costo_bd = cur.fetchone()
        cur.close()
        conn.close()

        print(f"\n✅ Carga completada")
        print(f"   Registros en BD: {total_bd:,}")
        print(f"   Costo total:     ${float(costo_bd):.4f}")

    except psycopg2.Error as e:
        print(f"❌ Error PostgreSQL: {e}")
        return False

    return True


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 cargar_azteca.py <archivo.xlsx> [archivo2.xlsx ...]")
        sys.exit(1)

    inicio = datetime.now()
    ok     = 0

    for archivo in sys.argv[1:]:
        if not os.path.exists(archivo):
            print(f"❌ No encontrado: {archivo}")
            continue
        if not archivo.endswith('.xlsx'):
            print(f"⚠️  Ignorado (no es .xlsx): {archivo}")
            continue
        if cargar_archivo(archivo):
            ok += 1

    elapsed = (datetime.now() - inicio).seconds
    print(f"\n⏱  {elapsed}s  |  Archivos cargados: {ok}/{len(sys.argv)-1}")


if __name__ == '__main__':
    main()