'use client';
// components/GraficaAzteca.jsx
// Gráfica combinada: Minutos (barras) + Costo (línea) por día/campaña

import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

const C = {
  bg2:    '#161b27',
  border: 'rgba(255,255,255,0.08)',
  text2:  '#8b93a8',
  text3:  '#5a6278',
  purple: '#a78bfa',
  sky:    '#38bdf8',
};
const FONT = "'JetBrains Mono','Fira Code',monospace";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'#1e2535', border:'0.5px solid rgba(255,255,255,0.14)',
      borderRadius:6, padding:'8px 12px', fontSize:12, fontFamily:FONT,
    }}>
      <div style={{ color:C.text3, marginBottom:6 }}>📅 {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, fontVariantNumeric:'tabular-nums', marginBottom:2 }}>
          {p.name === 'Costo $'
            ? `💲 Costo: $${Number(p.value).toFixed(2)}`
            : `⏱ Minutos: ${Number(p.value).toFixed(1)} min`
          }
        </div>
      ))}
    </div>
  );
}

export default function GraficaAzteca({ tendencia, loading, campana }) {
  const sinDatos = !tendencia || tendencia.length === 0;
  const titulo   = campana && campana !== ''
    ? `Costo y Minutos — ${campana}`
    : 'Costo y Minutos ';

  return (
    <div style={{
      background: C.bg2, border:`0.5px solid ${C.border}`,
      borderRadius:8, padding:'14px 16px', marginBottom:'1rem',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase' }}>
          {titulo}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:16, fontSize:11 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, color:C.purple }}>
            <span style={{ width:24, height:4, background:C.purple, borderRadius:2, display:'inline-block' }} />
            Minutos
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:5, color:C.sky }}>
            <span style={{ width:20, height:2, background:C.sky, borderRadius:1, display:'inline-block' }} />
            Costo $
          </span>
        </div>
      </div>

      {/* Gráfica */}
      {loading ? (
        <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:C.text3 }}>
          Cargando…
        </div>
      ) : sinDatos ? (
        <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:C.text3 }}>
          Sin datos para el rango seleccionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={tendencia} margin={{ top:4, right:20, left:-10, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

            {/* Eje X — fechas */}
            <XAxis
              dataKey="fecha"
              tick={{ fontSize:10, fill:C.text3, fontFamily:FONT }}
              tickFormatter={v => tendencia.length > 15 ? v.slice(5) : v.slice(5)}
            />

            {/* Eje Y izquierdo — Minutos */}
            <YAxis
              yAxisId="min"
              orientation="left"
              tick={{ fontSize:10, fill:C.text3, fontFamily:FONT }}
              tickFormatter={v => `${v}m`}
            />

            {/* Eje Y derecho — Costo */}
            <YAxis
              yAxisId="cost"
              orientation="right"
              tick={{ fontSize:10, fill:C.text3, fontFamily:FONT }}
              tickFormatter={v => `$${v}`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Barras — Minutos */}
            <Bar
              yAxisId="min"
              dataKey="minutos"
              name="Minutos"
              fill={C.purple}
              fillOpacity={0.65}
              radius={[3, 3, 0, 0]}
            />

            {/* Línea — Costo */}
            <Line
              yAxisId="cost"
              dataKey="costo"
              name="Costo $"
              stroke={C.sky}
              strokeWidth={2}
              dot={{ r:3, fill:C.sky, strokeWidth:0 }}
              activeDot={{ r:5 }}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
