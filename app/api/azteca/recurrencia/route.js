// app/api/azteca/recurrencia/route.js
import { NextResponse } from 'next/server';
import { Database }     from '@/lib/db';

class AztecaRecurrenciaService {
  static async fetch({ numero, desde, hasta }) {
    const [rResumen, rSda, rHistorial] = await Promise.all([
      Database.query(`
        SELECT status_name, COUNT(*) AS total
        FROM azteca_registros
        WHERE phone_number=$1 AND fecha BETWEEN $2 AND $3
        GROUP BY status_name ORDER BY total DESC
      `, [numero, desde, hasta]),
      Database.query(`
        SELECT CASE WHEN sda IS NULL OR sda='' THEN 'Sin SDA' ELSE sda END AS sda_grupo,
               COUNT(*) AS total
        FROM azteca_registros
        WHERE phone_number=$1 AND fecha BETWEEN $2 AND $3
        GROUP BY sda_grupo ORDER BY total DESC
      `, [numero, desde, hasta]),
      Database.query(`
        SELECT
          TO_CHAR(fecha,      'YYYY-MM-DD')  AS fecha,
          TO_CHAR(fecha_hora, 'HH24:MI:SS')  AS hora,
          usuario, sda, status_name, campania
        FROM azteca_registros
        WHERE phone_number=$1 AND fecha BETWEEN $2 AND $3
        ORDER BY COALESCE(fecha_hora, fecha::timestamp) DESC, id DESC
      `, [numero, desde, hasta]),
    ]);
    return {
      numero,
      total:    rHistorial.rows.length,
      resumen:  rResumen.rows.map(r => ({ status_name: r.status_name, total: parseInt(r.total) })),
      sda:      rSda.rows.map(r => ({ grupo: r.sda_grupo, total: parseInt(r.total) })),
      historial: rHistorial.rows.map(r => ({
        fecha:       r.fecha,
        hora:        r.hora || '--:--',
        usuario:     r.usuario     || '—',
        sda:         r.sda         || '—',
        status_name: r.status_name,
        campania:    r.campania,
      })),
    };
  }
}

export async function GET(req) {
  const numero = req.nextUrl.searchParams.get('numero');
  const desde  = req.nextUrl.searchParams.get('desde') || '2000-01-01';
  const hasta  = req.nextUrl.searchParams.get('hasta') || new Date().toISOString().slice(0,10);
  if (!numero) return NextResponse.json({ error: 'Falta número' }, { status: 400 });
  try {
    return NextResponse.json(await AztecaRecurrenciaService.fetch({ numero, desde, hasta }));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
