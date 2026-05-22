'use client';
// components/GraficaGeneral.jsx
// Costo (barras apiladas por campaña) + Minutos total (línea)
// Doble eje Y: izquierdo = Minutos, derecho = Costo $

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
  sky:    '#38bdf8',
  purple: '#a78bfa',
};
const FONT = "'JetBrains Mono','Fira Code',monospace";

// Paleta de colores para campañas — escala automáticamente
const PALETA = [
  '#3b82f6', // azul
  '#22d3a5', // teal
  '#f59e0b', // amber
  '#a78bfa', // purple
  '#f87171', // red
  '#34d399', // green
  '#fb923c', // orange
  '#60a5fa', // blue light
];

function CustomTooltip({ active, payload, label, campanas }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'#1e2535', border:'0.5px solid rgba(255,255,255,0.14)',
      borderRadius:6, padding:'10px 14px', fontSize:12, fontFamily:FONT,
      minWidth:180,
    }}>
      <div style={{ color:C.text3, marginBottom:8, fontWeight:600 }}>📅 {label}</div>

      {/* Minutos total (línea) */}
      {payload.find(p => p.dataKey === 'minutos_total') && (
        <div style={{ color:C.purple, marginBottom:6, display:'flex', justifyContent:'space-between', gap:16 }}>
          <span>⏱ Minutos total</span>
          <span style={{ fontWeight:700 }}>
            {(() => {
              const m = payload.find(p => p.dataKey === 'minutos_total')?.value || 0;
              const h = Math.floor(m / 60);
              const min = Math.round(m % 60);
              return h > 0 ? `${h}h ${min}m` : `${m.toFixed(1)} min`;
            })()}
          </span>
        </div>
      )}

      <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:6, marginTop:2 }}>
        <div style={{ fontSize:10, color:C.text3, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>
          💲 Costo por campaña
        </div>
        {campanas.map((camp, i) => {
          const p = payload.find(p => p.dataKey === `costo_${camp}`);
          if (!p || p.value === 0) return null;
          return (
            <div key={camp} style={{ display:'flex', justifyContent:'space-between', gap:16, marginBottom:3 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5, color:C.text2 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:PALETA[i%PALETA.length], display:'inline-block' }} />
                {camp}
              </span>
              <span style={{ color:PALETA[i%PALETA.length], fontWeight:600 }}>
                ${Number(p.value).toFixed(2)}
              </span>
            </div>
          );
        })}
        {/* Total costo */}
        {(() => {
          const total = campanas.reduce((sum, camp) => {
            const p = payload.find(p => p.dataKey === `costo_${camp}`);
            return sum + (p?.value || 0);
          }, 0);
          return total > 0 ? (
            <div style={{ display:'flex', justifyContent:'space-between', gap:16, borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:4, marginTop:4 }}>
              <span style={{ color:C.sky, fontWeight:600 }}>Total</span>
              <span style={{ color:C.sky, fontWeight:700 }}>${total.toFixed(2)}</span>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

export default function GraficaGeneral({ datos, campanas, loading }) {
  const sinDatos = !datos || datos.length === 0 || campanas.length === 0;

  // Determinar si mostrar el eje de costo (cuando haya datos reales)
  const hayCosto = datos?.some(d => d.costo_total > 0);

  return (
    <div style={{
      background:C.bg2, border:`0.5px solid ${C.border}`,
      borderRadius:8, padding:'14px 16px', marginBottom:'1rem',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
        <span style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase' }}>
          Costo y Minutos por día — todas las campañas
        </span>
        {/* Leyenda de campañas */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {campanas.map((camp, i) => (
            <span key={camp} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:C.text2 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:PALETA[i%PALETA.length], display:'inline-block' }} />
              {camp}
            </span>
          ))}
          <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:C.purple }}>
            <span style={{ width:20, height:2, background:C.purple, borderRadius:1, display:'inline-block' }} />
            Min total
          </span>
        </div>
      </div>

      {/* Gráfica */}
      {loading ? (
        <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:C.text3 }}>
          Cargando…
        </div>
      ) : sinDatos ? (
        <div style={{ height:240, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
          <div style={{ fontSize:12, color:C.text3 }}>Sin datos de costo/minutos para el rango seleccionado</div>
          <div style={{ fontSize:10, color:C.text3, background:'rgba(167,139,250,0.08)', border:'0.5px solid rgba(167,139,250,0.2)', borderRadius:4, padding:'4px 10px' }}>
            Disponible cuando se cargue la base completa
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={datos} margin={{ top:4, right:20, left:-10, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

            <XAxis
              dataKey="fecha"
              tick={{ fontSize:10, fill:C.text3, fontFamily:FONT }}
              tickFormatter={v => v.slice(5)}
            />

            {/* Eje izquierdo — Minutos */}
            <YAxis
              yAxisId="min"
              orientation="left"
              tick={{ fontSize:10, fill:C.text3, fontFamily:FONT }}
              tickFormatter={v => `${v}m`}
            />

            {/* Eje derecho — Costo (solo si hay datos) */}
            {hayCosto && (
              <YAxis
                yAxisId="cost"
                orientation="right"
                tick={{ fontSize:10, fill:C.text3, fontFamily:FONT }}
                tickFormatter={v => `$${v}`}
              />
            )}

            <Tooltip content={<CustomTooltip campanas={campanas} />} />

            {/* Barras apiladas de COSTO por campaña */}
            {campanas.map((camp, i) => (
              <Bar
                key={`costo_${camp}`}
                yAxisId={hayCosto ? 'cost' : 'min'}
                dataKey={`costo_${camp}`}
                name={camp}
                stackId="costo"
                fill={PALETA[i % PALETA.length]}
                fillOpacity={0.75}
                radius={i === campanas.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}

            {/* Línea de MINUTOS total */}
            <Line
              yAxisId="min"
              dataKey="minutos_total"
              name="Minutos total"
              stroke={C.purple}
              strokeWidth={2}
              dot={{ r:3, fill:C.purple, strokeWidth:0 }}
              activeDot={{ r:5 }}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
