'use client';
import {
  BarChart, Bar, LineChart, Line, ComposedChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const C = {
  bg2:'#161b27', border:'rgba(255,255,255,0.08)',
  text2:'#8b93a8', text3:'#5a6278',
  blue:'#3b82f6', teal:'#22d3a5', amber:'#f59e0b', red:'#ef4444',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1e2535', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:6, padding:'8px 12px', fontSize:12 }}>
      <div style={{ color:C.text3, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontVariantNumeric:'tabular-nums' }}>
          {p.name}: {String(p.name).toLowerCase().includes('costo') ? `$${p.value}` : p.value}
        </div>
      ))}
    </div>
  );
}

function Panel({ title, children, fullWidth }) {
  return (
    <div style={{
      background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px',
      ...(fullWidth ? { gridColumn:'1 / -1' } : {}),
    }}>
      <div style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase', marginBottom:12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const Placeholder = ({ loading }) => (
  <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:C.text3 }}>
    {loading ? 'Cargando…' : 'Sin datos para el rango seleccionado'}
  </div>
);

export default function GraficasPanel({ porHora, porDia, loading, esRango }) {
  const tickStyle = { fontSize:10, fill:C.text3 };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1rem' }}>

      {/* Gráfica por hora */}
      <Panel title={esRango ? 'Llamadas por hora (rango acumulado)' : 'Llamadas por hora'}>
        {loading || !porHora?.length ? <Placeholder loading={loading} /> : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={porHora} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hora" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Llamadas" fill={C.blue} fillOpacity={0.75} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Gráfica de costo acumulado */}
      <Panel title={esRango ? 'Costo por hora (rango acumulado)' : 'Costo acumulado'}>
        {loading || !porHora?.length ? <Placeholder loading={loading} /> : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={porHora} margin={{ top:4, right:4, left:-10, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hora" tick={tickStyle} />
              <YAxis tick={tickStyle} tickFormatter={v=>`$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="costo" name="Costo $" stroke={C.teal} strokeWidth={2} dot={{ r:3, fill:C.teal }} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Gráfica por día — solo visible en rangos de más de 1 día */}
      {esRango && porDia?.length > 1 && (
        <Panel title="Llamadas y costo por día" fullWidth>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={porDia} margin={{ top:4, right:16, left:-10, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="fecha" tick={{ fontSize:10, fill:C.text3 }}
                tickFormatter={v => v.slice(5)} />
              <YAxis yAxisId="left"  tick={tickStyle} />
              <YAxis yAxisId="right" orientation="right" tick={tickStyle} tickFormatter={v=>`$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:11, color:C.text3, paddingTop:8 }} />
              <Bar     yAxisId="left"  dataKey="total" name="Llamadas" fill={C.blue}  fillOpacity={0.7} radius={[2,2,0,0]} />
              <Bar     yAxisId="left"  dataKey="drops" name="Drops"    fill={C.red}   fillOpacity={0.6} radius={[2,2,0,0]} />
              <Line    yAxisId="right" dataKey="costo" name="Costo $"  stroke={C.teal} strokeWidth={2} dot={{ r:3, fill:C.teal }} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      )}

    </div>
  );
}
