// app/api/azteca/llamadas/route.js
// GET /api/azteca/llamadas?desde=&hasta=&campana=&limit=200
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  const desde   = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta   = req.nextUrl.searchParams.get('hasta') || desde;
  const campana = req.nextUrl.searchParams.get('campana') || null;
  const limit   = parseInt(req.nextUrl.searchParams.get('limit') || '500');
  const params  = [desde, hasta, limit];
  const filtro  = campana ? `AND campania = $4` : '';
  if (campana) params.push(campana);

  try {
    const { rows } = await pool.query(`
      SELECT
        fecha,
        usuario,
        phone_number,
        sda,
        status_name,
        campania,
        lead_id
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2 ${filtro}
      ORDER BY fecha DESC, lead_id DESC
      LIMIT $3
    `, params);

    return NextResponse.json(rows.map(r => ({
      fecha:       r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10),
      usuario:     r.usuario  || '—',
      phone:       r.phone_number,
      sda:         r.sda      || '—',
      status_name: r.status_name,
      campania:    r.campania,
      lead_id:     r.lead_id,
    })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
