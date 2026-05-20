// app/api/azteca/campanas/route.js
// GET /api/azteca/campanas?desde=&hasta=
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  const desde = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta = req.nextUrl.searchParams.get('hasta') || desde;

  try {
    const { rows } = await pool.query(`
      SELECT
        campania,
        COUNT(*)                                               AS total,
        COUNT(DISTINCT phone_number)
          FILTER (WHERE phone_number ~ '^[0-9]{10}$')         AS nums_unicos,
        COUNT(*) FILTER (WHERE sda ILIKE 'ANSWERED%')         AS contestadas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%promesa%') AS promesas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%pago%'
          AND status_name NOT ILIKE '%promesa%')              AS pagos,
        COUNT(*) FILTER (WHERE status_name ILIKE '%answering%'
          OR status_name ILIKE '%buzon%')                     AS buzon,
        COUNT(*) FILTER (WHERE status_name ILIKE '%no answer%'
          OR status_name ILIKE '%no contesta%')               AS no_contesta
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
      GROUP BY campania
      ORDER BY total DESC
    `, [desde, hasta]);

    return NextResponse.json(rows.map(r => ({
      campania:    r.campania,
      total:       parseInt(r.total),
      nums_unicos: parseInt(r.nums_unicos),
      contestadas: parseInt(r.contestadas),
      promesas:    parseInt(r.promesas),
      pagos:       parseInt(r.pagos),
      buzon:       parseInt(r.buzon),
      no_contesta: parseInt(r.no_contesta),
      tasa_contactacion: parseInt(r.total) > 0
        ? parseFloat(((parseInt(r.contestadas)/parseInt(r.total))*100).toFixed(1)) : 0,
    })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
