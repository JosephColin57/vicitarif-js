import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MOCK_POR_CAMPANA, isDbConnectionError } from '@/lib/mockData';

export async function GET(req) {
  const desde   = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta   = req.nextUrl.searchParams.get('hasta') || desde;
  const campana = req.nextUrl.searchParams.get('campana') || null;
  const params  = [desde, hasta];
  const filtro  = campana ? `AND c.nombre = $3` : '';
  if (campana) params.push(campana);
  try {
    const result = await pool.query(`
      SELECT c.nombre AS campana, COUNT(l.id) AS total, COALESCE(SUM(l.costo),0) AS costo
      FROM llamadas l JOIN campanas c ON c.id=l.campana_id
      WHERE DATE(l.fecha_hora) BETWEEN $1 AND $2 ${filtro}
      GROUP BY c.nombre ORDER BY costo DESC LIMIT 8`, params);
    return NextResponse.json(result.rows.map(r => ({ campana:r.campana, total:parseInt(r.total), costo:parseFloat(parseFloat(r.costo).toFixed(2)) })));
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json(MOCK_POR_CAMPANA(desde));
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
