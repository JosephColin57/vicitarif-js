// app/api/general/kpis/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';
import { AuthService }  from '@/lib/auth';

class GeneralKpisService {
  static parse(r) {
    const total       = parseInt(r.total)       || 0;
    const contestadas = parseInt(r.contestadas) || 0;
    const promesas    = parseInt(r.promesas)    || 0;
    const segTotal    = parseInt(r.seg_total)   || 0;
    return {
      total,
      nums_unicos:       parseInt(r.nums_unicos)    || 0,
      total_campanas:    parseInt(r.total_campanas) || 0,
      contestadas,
      promesas,
      pagos:             parseInt(r.pagos)           || 0,
      negativas:         parseInt(r.negativas)       || 0,
      no_contesta:       parseInt(r.no_contesta)     || 0,
      buzon:             parseInt(r.buzon)           || 0,
      fallidas:          parseInt(r.fallidas)        || 0,
      costo_total:       parseFloat(parseFloat(r.costo_total).toFixed(2)),
      minutos_total:     parseFloat((segTotal / 60).toFixed(1)),
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
        COUNT(*)                                                     AS total,
        COUNT(DISTINCT phone_number)
          FILTER (WHERE phone_number ~ '^[0-9]{10}$')               AS nums_unicos,
        COUNT(DISTINCT campana)                                      AS total_campanas,
        COUNT(*) FILTER (WHERE sda ILIKE 'ANSWERED%')               AS contestadas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%promesa%')       AS promesas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%pago%'
          AND status_name NOT ILIKE '%promesa%')                    AS pagos,
        COUNT(*) FILTER (WHERE status_name ILIKE '%negativa%')      AS negativas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%no answer%'
          OR  status_name ILIKE '%no contesta%')                    AS no_contesta,
        COUNT(*) FILTER (WHERE status_name ILIKE '%answering%'
          OR  status_name ILIKE '%buzon%')                          AS buzon,
        COUNT(*) FILTER (WHERE sda ILIKE 'FAILED%'
          OR  sda ILIKE 'BUSY%')                                    AS fallidas,
        COALESCE(SUM(costo_llamada), 0)                             AS costo_total,
        COALESCE(SUM(duracion_seg),  0)                             AS seg_total
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
        ${filtros.join(' ')}
    `, params);
    return this.parse(rows[0]);
  }
}

export async function GET(req) {
  const desde = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta = req.nextUrl.searchParams.get('hasta') || desde;

  const session = await AuthService.getSession();
  const campana = AuthService.getCampanaFiltro(session); // enforcement → campana col

  try {
    return NextResponse.json(await GeneralKpisService.fetch({ desde, hasta, campana }));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
