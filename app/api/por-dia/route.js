// app/api/por-dia/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isDbConnectionError } from '@/lib/mockData';

function mockPorDia(desde, hasta) {
  const result = [];
  const d = new Date(desde + 'T12:00:00');
  const h = new Date(hasta + 'T12:00:00');
  while (d <= h) {
    const fecha = d.toISOString().slice(0,10);
    const n     = fecha.replace(/-/g,'');
    let x = parseInt(n) & 0x7fffffff;
    x = Math.imul(x ^ (x>>>16), 0x45d9f3b);
    const r = () => { x = Math.imul(x^(x>>>16),0x45d9f3b); return (x>>>0)/0xffffffff; };
    const esFinde = [0,6].includes(d.getDay());
    result.push({
      fecha,
      total: Math.round((esFinde?40:80) + r()*(esFinde?40:80)),
      costo: parseFloat(((esFinde?15:30) + r()*40).toFixed(2)),
      drops: Math.round(r()*15),
    });
    d.setDate(d.getDate() + 1);
  }
  return result;
}

export async function GET(req) {
  const desde   = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta   = req.nextUrl.searchParams.get('hasta') || desde;
  const campana = req.nextUrl.searchParams.get('campana') || null;
  const params  = [desde, hasta];
  const filtro  = campana ? `AND c.nombre = $3` : '';
  if (campana) params.push(campana);
  try {
    const result = await pool.query(`
      SELECT DATE(l.fecha_hora) AS fecha, COUNT(*) AS total,
             COALESCE(SUM(l.costo),0) AS costo,
             SUM(CASE WHEN l.estado='drop' THEN 1 ELSE 0 END) AS drops
      FROM llamadas l LEFT JOIN campanas c ON c.id=l.campana_id
      WHERE DATE(l.fecha_hora) BETWEEN $1 AND $2 ${filtro}
      GROUP BY DATE(l.fecha_hora) ORDER BY fecha ASC`, params);
    return NextResponse.json(result.rows.map(r => ({
      fecha: r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10),
      total: parseInt(r.total),
      costo: parseFloat(parseFloat(r.costo).toFixed(2)),
      drops: parseInt(r.drops),
    })));
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json(mockPorDia(desde, hasta));
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
