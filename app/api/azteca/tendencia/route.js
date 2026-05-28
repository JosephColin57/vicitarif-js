// app/api/azteca/tendencia/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';
import { AuthService }  from '@/lib/auth';

class AztecaTendenciaService {
  static mock(desde, hasta) {
    const result = [];
    const d = new Date(desde + 'T12:00:00');
    const h = new Date(hasta  + 'T12:00:00');
    while (d <= h) {
      result.push({ fecha: d.toISOString().slice(0,10), costo: 0, minutos: 0 });
      d.setDate(d.getDate() + 1);
    }
    return result;
  }

  static buildFilters({ campania, campana, herramienta }, params) {
    const filtros = [];
    if (campania && campania !== '')               { params.push(campania);    filtros.push(`AND campania    = $${params.length}`); }
    if (campana)                                   { params.push(campana);     filtros.push(`AND campana     = $${params.length}`); }
    if (herramienta && herramienta !== 'todas')    { params.push(herramienta); filtros.push(`AND herramienta = $${params.length}`); }
    return filtros.join(' ');
  }

  static async fetch({ desde, hasta, campania, campana, herramienta }) {
    const params = [desde, hasta];
    const filtro = this.buildFilters({ campania, campana, herramienta }, params);
    const { rows } = await Database.query(`
      SELECT
        fecha,
        COALESCE(SUM(costo_llamada), 0)        AS costo,
        COALESCE(SUM(duracion_seg),  0) / 60.0 AS minutos
      FROM azteca_registros
      WHERE fecha BETWEEN $1 AND $2
        AND phone_number ~ '^[0-9]{10}$'
        ${filtro}
      GROUP BY fecha
      ORDER BY fecha ASC
    `, params);
    return rows.map(r => ({
      fecha:   r.fecha instanceof Date ? r.fecha.toISOString().slice(0,10) : String(r.fecha).slice(0,10),
      costo:   parseFloat(parseFloat(r.costo).toFixed(2)),
      minutos: parseFloat(parseFloat(r.minutos).toFixed(1)),
    }));
  }
}

export async function GET(req) {
  const desde       = req.nextUrl.searchParams.get('desde')       || new Date().toISOString().slice(0,10);
  const hasta       = req.nextUrl.searchParams.get('hasta')       || desde;
  const campania    = req.nextUrl.searchParams.get('campana')     || null; // UI → campania col
  const herramienta = req.nextUrl.searchParams.get('herramienta') || null;

  const session = await AuthService.getSession();
  const campana = AuthService.getCampanaFiltro(session); // enforcement → campana col

  try {
    return NextResponse.json(await AztecaTendenciaService.fetch({ desde, hasta, campania, campana, herramienta }));
  } catch (err) {
    if (['ECONNREFUSED','EHOSTDOWN','ETIMEDOUT'].includes(err.code)) {
      return NextResponse.json(AztecaTendenciaService.mock(desde, hasta));
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
