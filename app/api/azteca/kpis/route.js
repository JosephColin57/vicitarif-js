// app/api/azteca/kpis/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';
import { AuthService }  from '@/lib/auth';

class AztecaKpisService {
  static mock() {
    return {
      total:42035, nums_unicos:23554, promesas:89, pagos:62,
      no_contesta:375, buzon:278, contestadas:9931,
      no_answer_sda:27616, fallidas:1524, negativas:38,
      tasa_contactacion:23.6, tasa_promesa:0.9,
      costo_total:0, minutos_total:0,
    };
  }

  // campania → filtro granular de UI (columna campania, para admin)
  // campana  → enforcement de acceso por sesión (columna campana)
  static buildFilters({ campania, campana, herramienta }, params) {
    const filtros = [];
    if (campania)                               { params.push(campania);     filtros.push(`AND campania    = $${params.length}`); }
    if (campana)                                { params.push(campana);      filtros.push(`AND campana     = $${params.length}`); }
    if (herramienta && herramienta !== 'todas') { params.push(herramienta);  filtros.push(`AND herramienta = $${params.length}`); }
    return filtros.join(' ');
  }

  static parse(r) {
    const total       = parseInt(r.total)       || 0;
    const contestadas = parseInt(r.contestadas) || 0;
    const promesas    = parseInt(r.promesas)    || 0;
    const segTotal    = parseInt(r.seg_total)   || 0;
    return {
      total,
      nums_unicos:       parseInt(r.nums_unicos)  || 0,
      promesas,
      pagos:             parseInt(r.pagos)         || 0,
      no_contesta:       parseInt(r.no_contesta)   || 0,
      buzon:             parseInt(r.buzon)         || 0,
      contestadas,
      no_answer_sda:     parseInt(r.no_answer_sda) || 0,
      fallidas:          parseInt(r.fallidas)      || 0,
      negativas:         parseInt(r.negativas)     || 0,
      costo_total:       parseFloat(parseFloat(r.costo_total).toFixed(2)),
      minutos_total:     parseFloat((segTotal / 60).toFixed(1)),
      tasa_contactacion: total       > 0 ? parseFloat(((contestadas/total)*100).toFixed(1))    : 0,
      tasa_promesa:      contestadas > 0 ? parseFloat(((promesas/contestadas)*100).toFixed(1)) : 0,
    };
  }

  static async fetch({ desde, hasta, campania, campana, herramienta }) {
    const params = [desde, hasta];
    const filtro = this.buildFilters({ campania, campana, herramienta }, params);
    const { rows } = await Database.query(`
      SELECT
        COUNT(*)                                                       AS total,
        COUNT(DISTINCT phone_number)
          FILTER (WHERE phone_number ~ '^[0-9]{10}$')                 AS nums_unicos,
        COUNT(*) FILTER (WHERE status_name ILIKE '%promesa%')         AS promesas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%pago%'
          AND status_name NOT ILIKE '%promesa%')                      AS pagos,
        COUNT(*) FILTER (WHERE status_name ILIKE '%no answer%'
          OR  status_name ILIKE '%no contesta%')                      AS no_contesta,
        COUNT(*) FILTER (WHERE status_name ILIKE '%answering%'
          OR  status_name ILIKE '%buzon%')                            AS buzon,
        COUNT(*) FILTER (WHERE sda ILIKE 'ANSWERED%')                 AS contestadas,
        COUNT(*) FILTER (WHERE sda ILIKE 'NO ANSWER%')                AS no_answer_sda,
        COUNT(*) FILTER (WHERE sda ILIKE 'FAILED%'
          OR  sda ILIKE 'BUSY%')                                      AS fallidas,
        COUNT(*) FILTER (WHERE status_name ILIKE '%negativa%')        AS negativas,
        COALESCE(SUM(costo_llamada), 0)                               AS costo_total,
        COALESCE(SUM(duracion_seg),  0)                               AS seg_total
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
        ${filtro}
    `, params);
    return this.parse(rows[0]);
  }
}

export async function GET(req) {
  const desde       = req.nextUrl.searchParams.get('desde')       || new Date().toISOString().slice(0,10);
  const hasta       = req.nextUrl.searchParams.get('hasta')       || desde;
  const campania    = req.nextUrl.searchParams.get('campana')     || null; // UI → campania col
  const herramienta = req.nextUrl.searchParams.get('herramienta') || null;

  // Enforcement de acceso: si el usuario es rol 'campana', fuerza su campana (col campana)
  const session = await AuthService.getSession();
  const campana = AuthService.getCampanaFiltro(session);

  try {
    return NextResponse.json(await AztecaKpisService.fetch({ desde, hasta, campania, campana, herramienta }));
  } catch (err) {
    if (['ECONNREFUSED','EHOSTDOWN','ETIMEDOUT'].includes(err.code)) {
      return NextResponse.json(AztecaKpisService.mock());
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
