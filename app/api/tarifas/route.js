// app/api/tarifas/route.js — PostgreSQL
import { NextResponse } from 'next/server';
import pool             from '@/lib/db';
import { getSession }   from '@/lib/auth';

export async function GET() {
  try {
    const result = await pool.query(`SELECT tipo, tarifa_por_min, mult_fuera_horario FROM tarifas`);
    const tarifas = {};
    result.rows.forEach(r => {
      tarifas[r.tipo] = parseFloat(r.tarifa_por_min);
    });
    tarifas.fuera_horario = parseFloat(result.rows[0]?.mult_fuera_horario || 0.20);
    return NextResponse.json(tarifas);
  } catch {
    return NextResponse.json({ local:0.012, larga_dist:0.045, celular:0.035, voip:0.008, internacional:0.120, fuera_horario:0.20 });
  }
}

export async function PUT(req) {
  const session = await getSession();
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden editar tarifas' }, { status:403 });
  }
  const body    = await req.json();
  const allowed = ['local','larga_dist','celular','voip','internacional'];
  try {
    for (const tipo of allowed) {
      if (body[tipo] !== undefined) {
        await pool.query(
          `UPDATE tarifas SET tarifa_por_min=$1, mult_fuera_horario=$2 WHERE tipo=$3`,
          [parseFloat(body[tipo]), parseFloat(body.fuera_horario||0.20), tipo]
        );
      }
    }
    return NextResponse.json({ ok:true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}

export async function POST(req) {
  const { duracion_seg, tipo, hora } = await req.json();
  if (!duracion_seg || !tipo) {
    return NextResponse.json({ error: 'Faltan campos' }, { status:400 });
  }
  try {
    const result = await pool.query(
      `SELECT tarifa_por_min, mult_fuera_horario FROM tarifas WHERE tipo=$1`, [tipo]
    );
    const row     = result.rows[0] || { tarifa_por_min:0.012, mult_fuera_horario:0.20 };
    const tarifa  = parseFloat(row.tarifa_por_min);
    const horaNum = parseInt(hora ?? new Date().getHours());
    const mult    = (horaNum<8||horaNum>=20) ? (1+parseFloat(row.mult_fuera_horario)) : 1;
    const costo   = parseFloat(((duracion_seg/60)*tarifa*mult).toFixed(4));
    return NextResponse.json({ costo, tarifa, duracion_min:parseFloat((duracion_seg/60).toFixed(2)), fuera_horario:horaNum<8||horaNum>=20 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
