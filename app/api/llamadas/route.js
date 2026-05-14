// app/api/llamadas/route.js — PostgreSQL
import { NextResponse }                        from 'next/server';
import pool                                    from '@/lib/db';
import { MOCK_LLAMADAS, isDbConnectionError }  from '@/lib/mockData';

export async function GET(req) {
  const fecha = req.nextUrl.searchParams.get('fecha') || new Date().toISOString().slice(0,10);
  const limit = parseInt(req.nextUrl.searchParams.get('limit')||'50');
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(l.fecha_hora, 'HH24:MI') AS hora,
        a.extension,
        l.numero_destino  AS destino,
        l.tipo,
        l.direccion,
        l.duracion_seg,
        l.costo,
        l.estado,
        c.nombre          AS campana
      FROM llamadas l
      LEFT JOIN agentes  a ON a.id = l.agente_id
      LEFT JOIN campanas c ON c.id = l.campana_id
      WHERE DATE(l.fecha_hora) = $1
      ORDER BY l.fecha_hora DESC
      LIMIT $2
    `, [fecha, limit]);

    const rows = result.rows.map(r => {
      const dur = r.duracion_seg || 0;
      return {
        hora:      r.hora,
        extension: r.extension || '—',
        destino:   r.destino   || '—',
        tipo:      r.tipo,
        direccion: r.direccion,
        duracion:  `${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}`,
        costo:     `$${parseFloat(r.costo||0).toFixed(3)}`,
        estado:    r.estado,
        campana:   r.campana || '—',
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json(MOCK_LLAMADAS(fecha, limit));
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
