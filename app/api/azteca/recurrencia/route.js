// app/api/azteca/recurrencia/route.js
// GET /api/azteca/recurrencia?numero=5551234567&desde=&hasta=
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  const numero = req.nextUrl.searchParams.get('numero');
  const desde  = req.nextUrl.searchParams.get('desde') || '2000-01-01';
  const hasta  = req.nextUrl.searchParams.get('hasta') || new Date().toISOString().slice(0,10);

  if (!numero) return NextResponse.json({ error: 'Falta número' }, { status: 400 });

  try {
    // Resumen por status_name
    const rResumen = await pool.query(`
      SELECT status_name, COUNT(*) AS total
      FROM azteca_registros
      WHERE phone_number = $1 AND fecha BETWEEN $2 AND $3
      GROUP BY status_name ORDER BY total DESC
    `, [numero, desde, hasta]);

    // Resumen por SDA
    const rSda = await pool.query(`
      SELECT
        CASE
          WHEN sda ILIKE 'ANSWERED%'  THEN 'Contestada'
          WHEN sda ILIKE 'NO ANSWER%' THEN 'No contestó'
          WHEN sda ILIKE 'FAILED%'    THEN 'Fallo red'
          WHEN sda ILIKE 'BUSY%'      THEN 'Ocupado'
          ELSE COALESCE(sda, 'Sin SDA')
        END AS sda_grupo,
        COUNT(*) AS total
      FROM azteca_registros
      WHERE phone_number = $1 AND fecha BETWEEN $2 AND $3
      GROUP BY sda_grupo ORDER BY total DESC
    `, [numero, desde, hasta]);

    // Historial cronológico
    const rHistorial = await pool.query(`
      SELECT
        fecha,
        usuario,
        sda,
        status_name,
        campania,
        lead_id
      FROM azteca_registros
      WHERE phone_number = $1 AND fecha BETWEEN $2 AND $3
      ORDER BY fecha DESC, lead_id DESC
    `, [numero, desde, hasta]);

    const historial = rHistorial.rows.map(r => ({
      fecha:       r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10),
      usuario:     r.usuario || '—',
      sda:         r.sda     || '—',
      status_name: r.status_name,
      campania:    r.campania,
    }));

    return NextResponse.json({
      numero,
      total:    historial.length,
      resumen:  rResumen.rows.map(r => ({ status_name: r.status_name, total: parseInt(r.total) })),
      sda:      rSda.rows.map(r => ({ grupo: r.sda_grupo, total: parseInt(r.total) })),
      historial,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
