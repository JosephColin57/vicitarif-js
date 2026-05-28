// app/api/general/campanas/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';
import { AuthService }  from '@/lib/auth';

class GeneralCampanasService {
  static parse(r) {
    const total       = parseInt(r.total)       || 0;
    const contestadas = parseInt(r.contestadas) || 0;
    const promesas    = parseInt(r.promesas)    || 0;
    return {
      campana: r.campana, total,
      nums_unicos:  parseInt(r.nums_unicos) || 0,
      contestadas, promesas,
      pagos:       parseInt(r.pagos)        || 0,
      negativas:   parseInt(r.negativas)    || 0,
      no_contesta: parseInt(r.no_contesta)  || 0,
      buzon:       parseInt(r.buzon)        || 0,
      tasa_contactacion: total > 0
        ? parseFloat(((contestadas/total)*100).toFixed(1)) : 0,
      tasa_promesa: contestadas > 0
        ? parseFloat(((promesas/contestadas)*100).toFixed(1)) : 0,
    };
  }

  static async fetch({ desde, hasta, campana = null }) {
    const params  = [desde, hasta];
    const filtros = [];
    if (campana) { params.push(campana); filtros.push(`AND campana = $${params.length}`); }
    const { rows } = await Database.query(`
      SELECT
        campana,
        COUNT(*)                                                 AS total,
        COUNT(DISTINCT phone_number)                             AS nums_unicos,
        COUNT(*) FILTER (WHERE costo_llamada > 0)               AS contestadas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%promesa%')   AS promesas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%pago%'
          AND status_name NOT ILIKE '%promesa%')                AS pagos,
        COUNT(*) FILTER (WHERE status_name ILIKE '%negativa%')  AS negativas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%no answer%'
          OR status_name ILIKE '%no contesta%')                 AS no_contesta,
        COUNT(*) FILTER (WHERE status_name ILIKE '%answering%'
          OR status_name ILIKE '%buzon%')                       AS buzon
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
        ${filtros.join(' ')}
      GROUP BY campana
      ORDER BY
        CASE campana WHEN 'Sin costo' THEN -1
          ELSE COUNT(*) FILTER (WHERE costo_llamada > 0) * 100.0 / NULLIF(COUNT(*), 0)
        END DESC
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
    return NextResponse.json(await GeneralCampanasService.fetch({ desde, hasta, campana }));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
