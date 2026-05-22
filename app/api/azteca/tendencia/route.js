// app/api/azteca/tendencia/route.js
// GET /api/azteca/tendencia?desde=&hasta=&campana=&herramienta=
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function mockTendencia(desde, hasta) {
  const result = [];
  const d = new Date(desde + 'T12:00:00');
  const h = new Date(hasta  + 'T12:00:00');
  while (d <= h) {
    const fecha = d.toISOString().slice(0,10);
    result.push({ fecha, costo: 0, minutos: 0 });
    d.setDate(d.getDate() + 1);
  }
  return result;
}

export async function GET(req) {
  const desde       = req.nextUrl.searchParams.get('desde')       || new Date().toISOString().slice(0,10);
  const hasta       = req.nextUrl.searchParams.get('hasta')       || desde;
  const campana     = req.nextUrl.searchParams.get('campana')     || null;
  const herramienta = req.nextUrl.searchParams.get('herramienta') || null;

  const params  = [desde, hasta];
  const filtros = [];
  if (campana && campana !== '')      { params.push(campana);     filtros.push(`AND campania = $${params.length}`);    }
  if (herramienta && herramienta !== 'todas') { params.push(herramienta); filtros.push(`AND herramienta = $${params.length}`); }
  const filtro = filtros.join(' ');

  try {
    const { rows } = await pool.query(`
      SELECT
        fecha,
        COALESCE(SUM(costo_llamada), 0)       AS costo,
        COALESCE(SUM(duracion_seg),  0) / 60.0 AS minutos
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
        ${filtro}
      GROUP BY fecha
      ORDER BY fecha ASC
    `, params);

    return NextResponse.json(rows.map(r => ({
      fecha:   r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10),
      costo:   parseFloat(parseFloat(r.costo).toFixed(2)),
      minutos: parseFloat(parseFloat(r.minutos).toFixed(1)),
    })));
  } catch (err) {
    if (['ECONNREFUSED','EHOSTDOWN','ETIMEDOUT'].includes(err.code)) {
      return NextResponse.json(mockTendencia(desde, hasta));
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
