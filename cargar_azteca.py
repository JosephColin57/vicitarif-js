#!/usr/bin/env python3
# ============================================================
#  cargar_azteca.py v2 — Usa lead_id para evitar duplicados reales
#
#  Uso:
#    python3 cargar_azteca.py azteca_18052026.xlsx
#    python3 cargar_azteca.py /ruta/*.xlsx   (varios archivos)
#
#  Dependencias:
#    pip3 install pandas openpyxl psycopg2-binary
# ============================================================

import sys
import os
import re
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime

# ── Configuración de BD ──────────────────────────────────────
DB_CONFIG = {
    'host':     os.getenv('DB_HOST', 'localhost'),
    'port':     int(os.getenv('DB_PORT', '5432')),
    'user':     os.getenv('DB_USER', 'laclavees12345'),
    'password': os.getenv('DB_PASS', ''),
    'dbname':   os.getenv('DB_NAME', 'vicitarif'),
}

# ── Índices de columnas del xlsx ─────────────────────────────
COL_LEAD_ID     = 0   # A  — lead_id
COL_DATE        = 3   # D  — date
COL_STATUS      = 4   # E  — status
COL_USER        = 5   # F  — user
COL_PHONE       = 12  # M  — phone_number
COL_SDA         = 13  # N  — sda
COL_STATUS_NAME = 37  # AL — status_name
COL_CAMPANIA    = 39  # AN — campania_description

def limpiar(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    return str(v).strip() or None

def limpiar_telefono(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip()
    if s.upper().startswith('V'):
        return s
    solo = re.sub(r'\D', '', s)
    return solo if len(solo) == 10 else s

def preparar_schema(cur):
    """Asegura que la tabla tenga la columna lead_id y el índice correcto."""
    # Agregar columna lead_id si no existe
    cur.execute("""
        ALTER TABLE azteca_registros 
        ADD COLUMN IF NOT EXISTS lead_id BIGINT;
    """)
    # Eliminar índice restrictivo anterior si existe
    cur.execute("DROP INDEX IF EXISTS idx_azt_unique;")
    # Crear índice correcto basado en lead_id + archivo
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_azt_lead_archivo
        ON azteca_registros (lead_id, archivo_origen)
        WHERE lead_id IS NOT NULL;
    """)

def cargar_archivo(ruta_archivo):
    nombre_archivo = os.path.basename(ruta_archivo)
    print(f"\n{'='*60}")
    print(f"  Cargando: {nombre_archivo}")
    print(f"{'='*60}")

    # ── Leer Excel ────────────────────────────────────────────
    print("📖 Leyendo archivo Excel...")
    try:
        df = pd.read_excel(ruta_archivo, sheet_name='azteca_18052026', dtype=str)
    except Exception as e:
        print(f"❌ Error al leer Excel: {e}")
        return False

    total_filas = len(df)
    print(f"   Filas encontradas: {total_filas:,}")

    # ── Procesar registros ────────────────────────────────────
    print("🔄 Procesando registros...")
    registros = []
    omitidos  = 0
    errores   = 0

    for idx, row in df.iterrows():
        try:
            # lead_id (columna A)
            lead_id_raw = row.iloc[COL_LEAD_ID]
            try:
                lead_id = int(float(lead_id_raw)) if lead_id_raw and not pd.isna(lead_id_raw) else None
            except:
                lead_id = None

            # Fecha
            fecha_raw = row.iloc[COL_DATE]
            if pd.isna(fecha_raw) if isinstance(fecha_raw, float) else False:
                omitidos += 1
                continue
            try:
                fecha = pd.to_datetime(fecha_raw).date()
            except:
                omitidos += 1
                continue

            # Campos obligatorios
            phone       = limpiar_telefono(row.iloc[COL_PHONE])
            status_name = limpiar(row.iloc[COL_STATUS_NAME])
            campania    = limpiar(row.iloc[COL_CAMPANIA])

            if not phone or not status_name or not campania:
                omitidos += 1
                continue

            registros.append((
                lead_id,
                fecha,
                limpiar(row.iloc[COL_STATUS]),
                limpiar(row.iloc[COL_USER]),
                phone,
                limpiar(row.iloc[COL_SDA]),
                status_name,
                campania,
                nombre_archivo,
            ))
        except Exception as e:
            errores += 1
            if errores <= 3:
                print(f"   ⚠ Error fila {idx+2}: {e}")

    print(f"   Registros válidos:  {len(registros):,}")
    print(f"   Omitidos:           {omitidos:,}")
    if errores:
        print(f"   Errores parseo:     {errores:,}")

    # ── Insertar en PostgreSQL ────────────────────────────────
    print("📤 Insertando en PostgreSQL...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor()

        # Preparar schema (agrega columna lead_id y corrige índice)
        preparar_schema(cur)
        conn.commit()

        sql = """
            INSERT INTO azteca_registros
              (lead_id, fecha, status, usuario, phone_number, sda,
               status_name, campania, archivo_origen)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (lead_id, archivo_origen)
            WHERE lead_id IS NOT NULL
            DO NOTHING
        """
        execute_batch(cur, sql, registros, page_size=2000)
        conn.commit()

        # Contar total en BD para este archivo
        cur.execute(
            "SELECT COUNT(*) FROM azteca_registros WHERE archivo_origen = %s",
            (nombre_archivo,)
        )
        total_bd = cur.fetchone()[0]
        cur.close()
        conn.close()

        print(f"\n✅ Carga completada")
        print(f"   Registros procesados:    {len(registros):,}")
        print(f"   Registros en BD:         {total_bd:,}")
        if total_bd < len(registros):
            print(f"   Duplicados ignorados:    {len(registros)-total_bd:,}")

    except psycopg2.Error as e:
        print(f"❌ Error PostgreSQL: {e}")
        return False

    # ── Resumen ───────────────────────────────────────────────
    numeros_reales = sum(1 for r in registros if r[4] and not r[4].upper().startswith('V') and len(re.sub(r'\D','',r[4]))==10)
    internos       = sum(1 for r in registros if r[4] and r[4].upper().startswith('V'))
    campanas       = len(set(r[7] for r in registros if r[7]))
    estados        = len(set(r[6] for r in registros if r[6]))

    print(f"\n📊 Resumen:")
    print(f"   Números reales (10 dígitos): {numeros_reales:,}")
    print(f"   IDs internos Vicidial (V...): {internos:,}")
    print(f"   Campañas distintas:          {campanas}")
    print(f"   Estados distintos:           {estados}")
    return True

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 cargar_azteca.py <archivo.xlsx> [archivo2.xlsx ...]")
        sys.exit(1)

    inicio   = datetime.now()
    archivos = sys.argv[1:]
    ok = 0

    for archivo in archivos:
        if not os.path.exists(archivo):
            print(f"❌ No encontrado: {archivo}")
            continue
        if not archivo.endswith('.xlsx'):
            print(f"⚠ Saltando {archivo} (no es .xlsx)")
            continue
        if cargar_archivo(archivo):
            ok += 1

    duracion = (datetime.now() - inicio).seconds
    print(f"\n⏱ Tiempo total: {duracion}s | Archivos cargados: {ok}/{len(archivos)}")

if __name__ == '__main__':
    main()