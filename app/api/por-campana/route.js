// app/api/por-campana/route.js — PostgreSQL
import { NextResponse }                           from 'next/server';
import pool                                       from '@/lib/db';
import { MOCK_POR_CAMPANA, isDbConnectionError }  from '@/lib/mockData';

export async function GET(req) {
  const fecha = req.nextUrl.searchParams.get('fecha') || new Date().toISOString().slice(0,10);
  try {
    const result = await pool.query(`
      SELECT
        c.nombre          AS campana,
        COUNT(l.id)       AS total,
        COALESCE(SUM(l.costo), 0) AS costo
      FROM llamadas l
      JOIN campanas c ON c.id = l.campana_id
      WHERE DATE(l.fecha_hora) = $1
      GROUP BY c.nombre
      ORDER BY costo DESC
      LIMIT 8
    `, [fecha]);

    return NextResponse.json(result.rows.map(r => ({
      campana: r.campana,
      total:   parseInt(r.total),
      costo:   parseFloat(parseFloat(r.costo).toFixed(2)),
    })));
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json(MOCK_POR_CAMPANA(fecha));
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
