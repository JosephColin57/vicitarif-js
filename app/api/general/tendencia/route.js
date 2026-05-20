import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  const desde = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta = req.nextUrl.searchParams.get('hasta') || desde;
  try {
    const { rows } = await pool.query(`
      SELECT
        fecha,
        COUNT(*)                                               AS total,
        COUNT(*) FILTER (WHERE sda ILIKE 'ANSWERED%')         AS contestadas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%promesa%') AS promesas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%pago%'
          AND status_name NOT ILIKE '%promesa%')              AS pagos
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
      GROUP BY fecha ORDER BY fecha ASC
    `, [desde, hasta]);
    return NextResponse.json(rows.map(r => ({
      fecha:       r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10),
      total:       parseInt(r.total)||0,
      contestadas: parseInt(r.contestadas)||0,
      promesas:    parseInt(r.promesas)||0,
      pagos:       parseInt(r.pagos)||0,
    })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
