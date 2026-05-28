// app/api/azteca/campanas/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';
import { AuthService }  from '@/lib/auth';

class AztecaCampanasService {
  static parse(r) {
    const total       = parseInt(r.total);
    const contestadas = parseInt(r.contestadas);
    return {
      campania:    r.campania,
      total,
      nums_unicos: parseInt(r.nums_unicos),
      contestadas,
      promesas:    parseInt(r.promesas),
      pagos:       parseInt(r.pagos),
      buzon:       parseInt(r.buzon),
      no_contesta: parseInt(r.no_contesta),
      tasa_contactacion: total > 0
        ? parseFloat(((contestadas / total) * 100).toFixed(1)) : 0,
    };
  }

  static async fetch({ desde, hasta, campania = null, campana = null }) {
    const params  = [desde, hasta];
    const filtros = [];
    if (campania) { params.push(campania); filtros.push(`AND campania = $${params.length}`); }
    if (campana)  { params.push(campana);  filtros.push(`AND campana  = $${params.length}`); }
    const { rows } = await Database.query(`
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
        ${filtros.join(' ')}
      GROUP BY campania
      ORDER BY total DESC
    `, params);
    return rows.map(r => this.parse(r));
  }
}

export async function GET(req) {
  const desde    = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta    = req.nextUrl.searchParams.get('hasta') || desde;
  const campania = req.nextUrl.searchParams.get('campana') || null; // UI → campania col

  const session = await AuthService.getSession();
  const campana = AuthService.getCampanaFiltro(session); // enforcement → campana col

  try {
    return NextResponse.json(await AztecaCampanasService.fetch({ desde, hasta, campania, campana }));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
