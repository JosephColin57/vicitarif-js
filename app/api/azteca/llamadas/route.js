// app/api/azteca/llamadas/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  const desde   = req.nextUrl.searchParams.get('desde')   || new Date().toISOString().slice(0,10);
  const hasta   = req.nextUrl.searchParams.get('hasta')   || desde;
  const campana = req.nextUrl.searchParams.get('campana') || null;
  const buscar  = req.nextUrl.searchParams.get('buscar')  || null;
  const limit   = parseInt(req.nextUrl.searchParams.get('limit') || '500');

  try {
    let query, params;

    if (buscar) {
      // Búsqueda: agrupa por número único, muestra última interacción y total de contactos
      params = [`%${buscar}%`, `%${buscar}%`, `%${buscar}%`];
      const filtros = [];
      if (campana) { params.push(campana); filtros.push(`AND campania = $${params.length}`); }
      params.push(200);
      query = `
        SELECT
          r.phone_number                                  AS phone,
          COUNT(*)                                        AS total_contactos,
          MAX(r.fecha)                                    AS ultima_fecha,
          (ARRAY_AGG(r.usuario    ORDER BY r.fecha DESC))[1] AS usuario,
          (ARRAY_AGG(r.sda        ORDER BY r.fecha DESC))[1] AS sda,
          (ARRAY_AGG(r.status_name ORDER BY r.fecha DESC))[1] AS status_name,
          (ARRAY_AGG(r.campania   ORDER BY r.fecha DESC))[1] AS campania,
          COALESCE(SUM(r.duracion_seg), 0)                AS duracion_seg,
          COALESCE(SUM(r.costo_llamada), 0)               AS costo
        FROM azteca_registros r
        WHERE (
          r.phone_number ILIKE $1
          OR r.usuario   ILIKE $2
          OR r.campania  ILIKE $3
        )
        ${filtros.join(' ')}
        GROUP BY r.phone_number
        ORDER BY ultima_fecha DESC, total_contactos DESC
        LIMIT $${params.length}
      `;
    } else {
      // Vista normal por rango — también agrupa por número único
      params = [desde, hasta];
      const filtros = [];
      if (campana) { params.push(campana); filtros.push(`AND campania = $${params.length}`); }
      params.push(limit);
      query = `
        SELECT
          r.phone_number                                    AS phone,
          COUNT(*)                                          AS total_contactos,
          MAX(r.fecha)                                      AS ultima_fecha,
          (ARRAY_AGG(r.usuario     ORDER BY r.fecha DESC))[1] AS usuario,
          (ARRAY_AGG(r.sda         ORDER BY r.fecha DESC))[1] AS sda,
          (ARRAY_AGG(r.status_name ORDER BY r.fecha DESC))[1] AS status_name,
          (ARRAY_AGG(r.campania    ORDER BY r.fecha DESC))[1] AS campania,
          COALESCE(SUM(r.duracion_seg),  0)                 AS duracion_seg,
          COALESCE(SUM(r.costo_llamada), 0)                 AS costo
        FROM azteca_registros r
        WHERE r.fecha BETWEEN $1 AND $2
        ${filtros.join(' ')}
        GROUP BY r.phone_number
        ORDER BY ultima_fecha DESC, total_contactos DESC
        LIMIT $${params.length}
      `;
    }

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows.map(r => {
      const dur = parseInt(r.duracion_seg) || 0;
      return {
        fecha:            r.ultima_fecha instanceof Date
          ? r.ultima_fecha.toISOString().slice(0,10)
          : String(r.ultima_fecha).slice(0,10),
        usuario:          r.usuario     || '—',
        phone:            r.phone       || '—',
        sda:              r.sda         || '—',
        status_name:      r.status_name,
        campania:         r.campania,
        total_contactos:  parseInt(r.total_contactos) || 1,
        duracion:         `${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}`,
        costo:            `$${parseFloat(r.costo||0).toFixed(3)}`,
      };
    }));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
