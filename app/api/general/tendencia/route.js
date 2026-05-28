// app/api/general/tendencia/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';
import { AuthService }  from '@/lib/auth';

class GeneralTendenciaService {
  static parse(r) {
    return {
      fecha:       r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10),
      total:       parseInt(r.total)       || 0,
      contestadas: parseInt(r.contestadas) || 0,
      promesas:    parseInt(r.promesas)    || 0,
      pagos:       parseInt(r.pagos)       || 0,
    };
  }

  static async fetch({ desde, hasta, campana = null }) {
    const params  = [desde, hasta];
    const filtros = [];
    if (campana) { params.push(campana); filtros.push(`AND campana = $${params.length}`); }
    const { rows } = await Database.query(`
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
        ${filtros.join(' ')}
      GROUP BY fecha ORDER BY fecha ASC
    `, params);
    return rows.map(r => this.parse(r));
  }
}

export async function GET(req) {
  const desde = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta = req.nextUrl.searchParams.get('hasta') || desde;

  const session = await AuthService.getSession();
  const campana = AuthService.getCampanaFiltro(session); // enforcement → campana col

  try {
    return NextResponse.json(await GeneralTendenciaService.fetch({ desde, hasta, campana }));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
