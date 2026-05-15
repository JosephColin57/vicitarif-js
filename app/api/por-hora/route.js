import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MOCK_POR_HORA, isDbConnectionError } from '@/lib/mockData';

export async function GET(req) {
  const desde   = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta   = req.nextUrl.searchParams.get('hasta') || desde;
  const campana = req.nextUrl.searchParams.get('campana') || null;
  const params  = [desde, hasta];
  const filtro  = campana ? `AND c.nombre = $3` : '';
  if (campana) params.push(campana);
  try {
    const result = await pool.query(`
      SELECT EXTRACT(HOUR FROM l.fecha_hora)::int AS hora,
             COUNT(*) AS total, COALESCE(SUM(l.duracion_seg),0) AS seg_total,
             SUM(CASE WHEN l.estado='drop' THEN 1 ELSE 0 END) AS drops
      FROM llamadas l LEFT JOIN campanas c ON c.id=l.campana_id
      WHERE DATE(l.fecha_hora) BETWEEN $1 AND $2 ${filtro}
      GROUP BY EXTRACT(HOUR FROM l.fecha_hora) ORDER BY hora`, params);
    const resultado = Array.from({length:24},(_,h) => {
      const f = result.rows.find(r=>r.hora===h);
      return { hora:`${String(h).padStart(2,'0')}:00`, total:parseInt(f?.total||0), costo:parseFloat(((parseInt(f?.seg_total||0))/60*0.025).toFixed(2)), drops:parseInt(f?.drops||0) };
    }).filter(r=>r.total>0);
    return NextResponse.json(resultado);
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json(MOCK_POR_HORA(desde));
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
