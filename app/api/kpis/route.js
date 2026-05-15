import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { MOCK_KPIS, isDbConnectionError } from '@/lib/mockData';

export async function GET(req) {
  const desde   = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta   = req.nextUrl.searchParams.get('hasta') || desde;
  const campana = req.nextUrl.searchParams.get('campana') || null;
  const filtro  = campana ? `AND c.nombre = '${campana}'` : '';
  try {
    const out = await pool.query(`
      SELECT COUNT(*) AS total, COALESCE(SUM(l.duracion_seg),0) AS seg,
             SUM(CASE WHEN l.estado='drop' THEN 1 ELSE 0 END) AS drops
      FROM llamadas l LEFT JOIN campanas c ON c.id=l.campana_id
      WHERE DATE(l.fecha_hora) BETWEEN $1 AND $2 AND l.direccion='OUTBOUND' ${filtro}`, [desde, hasta]);
    const inn = await pool.query(`
      SELECT COUNT(*) AS total, COALESCE(SUM(l.duracion_seg),0) AS seg,
             SUM(CASE WHEN l.estado='drop' THEN 1 ELSE 0 END) AS drops
      FROM llamadas l LEFT JOIN campanas c ON c.id=l.campana_id
      WHERE DATE(l.fecha_hora) BETWEEN $1 AND $2 AND l.direccion='INBOUND' ${filtro}`, [desde, hasta]);
    const totalLlamadas = parseInt(out.rows[0].total||0) + parseInt(inn.rows[0].total||0);
    const totalSeg      = parseInt(out.rows[0].seg  ||0) + parseInt(inn.rows[0].seg  ||0);
    const totalDrop     = parseInt(out.rows[0].drops||0) + parseInt(inn.rows[0].drops||0);
    return NextResponse.json({
      totalLlamadas,
      costoTotal:       parseFloat((totalSeg/60*0.025).toFixed(2)),
      ahtSeg:           totalLlamadas>0 ? Math.round(totalSeg/totalLlamadas) : 0,
      llamadasPerdidas: totalDrop,
      dropRate:         totalLlamadas>0 ? parseFloat(((totalDrop/totalLlamadas)*100).toFixed(1)) : 0,
    });
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json({ ...MOCK_KPIS(desde), _mock:true });
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
