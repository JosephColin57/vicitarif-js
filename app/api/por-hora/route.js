// app/api/por-hora/route.js — PostgreSQL
import { NextResponse }                        from 'next/server';
import pool                                    from '@/lib/db';
import { MOCK_POR_HORA, isDbConnectionError }  from '@/lib/mockData';

export async function GET(req) {
  const fecha = req.nextUrl.searchParams.get('fecha') || new Date().toISOString().slice(0,10);
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM fecha_hora)::int        AS hora,
        COUNT(*)                                  AS total,
        COALESCE(SUM(duracion_seg), 0)            AS seg_total,
        SUM(CASE WHEN estado='drop' THEN 1 ELSE 0 END) AS drops
      FROM llamadas
      WHERE DATE(fecha_hora) = $1
      GROUP BY EXTRACT(HOUR FROM fecha_hora)
      ORDER BY hora
    `, [fecha]);

    const resultado = Array.from({length:24}, (_,h) => {
      const f = result.rows.find(r => r.hora === h);
      return {
        hora:  `${String(h).padStart(2,'0')}:00`,
        total: parseInt(f?.total||0),
        costo: parseFloat(((parseInt(f?.seg_total||0))/60*0.025).toFixed(2)),
        drops: parseInt(f?.drops||0),
      };
    }).filter(r => r.total > 0);

    return NextResponse.json(resultado);
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json(MOCK_POR_HORA(fecha));
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
