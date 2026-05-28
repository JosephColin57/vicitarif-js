// app/api/azteca/llamadas/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';
import { AuthService }  from '@/lib/auth';

class AztecaLlamadasService {
  static formatRow(r) {
    const dur = parseInt(r.duracion_seg) || 0;
    return {
      fecha:           r.ultima_fecha instanceof Date
        ? r.ultima_fecha.toISOString().slice(0,10)
        : String(r.ultima_fecha).slice(0,10),
      usuario:         r.usuario     || '—',
      phone:           r.phone       || '—',
      sda:             r.sda         || '—',
      status_name:     r.status_name,
      campania:        r.campania,
      total_contactos: parseInt(r.total_contactos) || 1,
      duracion:        `${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}`,
      costo:           `$${parseFloat(r.costo||0).toFixed(3)}`,
    };
  }

  static async buscar({ buscar, campania, campana }) {
    const params  = [`%${buscar}%`, `%${buscar}%`, `%${buscar}%`];
    const filtros = [];
    if (campania) { params.push(campania); filtros.push(`AND campania = $${params.length}`); }
    if (campana)  { params.push(campana);  filtros.push(`AND campana  = $${params.length}`); }
    params.push(200);
    const { rows } = await Database.query(`
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
      WHERE (r.phone_number ILIKE $1 OR r.usuario ILIKE $2 OR r.campania ILIKE $3)
        ${filtros.join(' ')}
      GROUP BY r.phone_number
      ORDER BY ultima_fecha DESC, total_contactos DESC
      LIMIT $${params.length}
    `, params);
    return rows.map(r => this.formatRow(r));
  }

  static async porRango({ desde, hasta, campania, campana, limit }) {
    const params  = [desde, hasta];
    const filtros = [];
    if (campania) { params.push(campania); filtros.push(`AND campania = $${params.length}`); }
    if (campana)  { params.push(campana);  filtros.push(`AND campana  = $${params.length}`); }
    params.push(limit);
    const { rows } = await Database.query(`
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
    `, params);
    return rows.map(r => this.formatRow(r));
  }
}

export async function GET(req) {
  const desde    = req.nextUrl.searchParams.get('desde')   || new Date().toISOString().slice(0,10);
  const hasta    = req.nextUrl.searchParams.get('hasta')   || desde;
  const campania = req.nextUrl.searchParams.get('campana') || null; // UI → campania col
  const buscar   = req.nextUrl.searchParams.get('buscar')  || null;
  const limit    = parseInt(req.nextUrl.searchParams.get('limit') || '500');

  const session = await AuthService.getSession();
  const campana = AuthService.getCampanaFiltro(session); // enforcement → campana col

  try {
    const data = buscar
      ? await AztecaLlamadasService.buscar({ buscar, campania, campana })
      : await AztecaLlamadasService.porRango({ desde, hasta, campania, campana, limit });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
