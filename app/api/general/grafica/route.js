// app/api/general/grafica/route.js
// GET /api/general/grafica?desde=&hasta=
// Devuelve datos por día con costo y minutos desglosados por campaña
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  const desde = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta = req.nextUrl.searchParams.get('hasta') || desde;

  try {
    // Paso 1: campañas activas en el rango
    const { rows: campRows } = await pool.query(`
      SELECT DISTINCT campania
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
      ORDER BY campania
    `, [desde, hasta]);
    const campanas = campRows.map(r => r.campania);

    // Paso 2: costo y minutos por día + campaña
    const { rows } = await pool.query(`
      SELECT
        fecha,
        campania,
        COALESCE(SUM(costo_llamada), 0)        AS costo,
        COALESCE(SUM(duracion_seg),  0) / 60.0 AS minutos
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
      GROUP BY fecha, campania
      ORDER BY fecha ASC, campania
    `, [desde, hasta]);

    // Paso 3: pivotar — una fila por fecha con columna por campaña
    const porFecha = {};
    rows.forEach(r => {
      const f = r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10);
      if (!porFecha[f]) {
        porFecha[f] = { fecha: f, costo_total: 0, minutos_total: 0 };
        campanas.forEach(c => { porFecha[f][`costo_${c}`] = 0; porFecha[f][`min_${c}`] = 0; });
      }
      const costo   = parseFloat(parseFloat(r.costo).toFixed(2));
      const minutos = parseFloat(parseFloat(r.minutos).toFixed(1));
      porFecha[f][`costo_${r.campania}`]   = costo;
      porFecha[f][`min_${r.campania}`]     = minutos;
      porFecha[f].costo_total   += costo;
      porFecha[f].minutos_total += minutos;
    });

    // Redondear totales
    Object.values(porFecha).forEach(d => {
      d.costo_total   = parseFloat(d.costo_total.toFixed(2));
      d.minutos_total = parseFloat(d.minutos_total.toFixed(1));
    });

    return NextResponse.json({
      campanas,
      datos: Object.values(porFecha),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
