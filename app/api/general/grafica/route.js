// app/api/general/grafica/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';
import { AuthService }  from '@/lib/auth';

class GeneralGraficaService {
  static async fetchCampanas({ desde, hasta, campana = null }) {
    const params  = [desde, hasta];
    const filtros = [];
    if (campana) { params.push(campana); filtros.push(`AND campana = $${params.length}`); }
    const { rows } = await Database.query(`
      SELECT DISTINCT campana
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
        ${filtros.join(' ')}
      ORDER BY campana
    `, params);
    return rows.map(r => r.campana);
  }

  static async fetchDatos({ desde, hasta, campana = null }) {
    const params  = [desde, hasta];
    const filtros = [];
    if (campana) { params.push(campana); filtros.push(`AND campana = $${params.length}`); }
    const { rows } = await Database.query(`
      SELECT
        fecha, campana,
        COALESCE(SUM(costo_llamada), 0)        AS costo,
        COALESCE(SUM(duracion_seg),  0) / 60.0 AS minutos
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
        ${filtros.join(' ')}
      GROUP BY fecha, campana
      ORDER BY fecha ASC, campana
    `, params);
    return rows;
  }

  static pivot(campanas, rows) {
    const porFecha = {};
    rows.forEach(r => {
      const f = r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10);
      if (!porFecha[f]) {
        porFecha[f] = { fecha: f, costo_total: 0, minutos_total: 0 };
        campanas.forEach(c => { porFecha[f][`costo_${c}`] = 0; porFecha[f][`min_${c}`] = 0; });
      }
      const costo   = parseFloat(parseFloat(r.costo).toFixed(2));
      const minutos = parseFloat(parseFloat(r.minutos).toFixed(1));
      porFecha[f][`costo_${r.campana}`]  = costo;
      porFecha[f][`min_${r.campana}`]    = minutos;
      porFecha[f].costo_total   += costo;
      porFecha[f].minutos_total += minutos;
    });
    Object.values(porFecha).forEach(d => {
      d.costo_total   = parseFloat(d.costo_total.toFixed(2));
      d.minutos_total = parseFloat(d.minutos_total.toFixed(1));
    });
    return Object.values(porFecha);
  }

  static async fetch({ desde, hasta, campana = null }) {
    const [campanas, rows] = await Promise.all([
      this.fetchCampanas({ desde, hasta, campana }),
      this.fetchDatos({ desde, hasta, campana }),
    ]);
    return { campanas, datos: this.pivot(campanas, rows) };
  }
}

export async function GET(req) {
  const desde = req.nextUrl.searchParams.get('desde') || new Date().toISOString().slice(0,10);
  const hasta = req.nextUrl.searchParams.get('hasta') || desde;

  const session = await AuthService.getSession();
  const campana = AuthService.getCampanaFiltro(session); // enforcement → campana col

  try {
    return NextResponse.json(await GeneralGraficaService.fetch({ desde, hasta, campana }));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
