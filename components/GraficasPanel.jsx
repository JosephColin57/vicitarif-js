'use client';
// components/GraficasPanel.jsx
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const C = { bg2:'#161b27', border:'rgba(255,255,255,0.08)', text2:'#8b93a8', text3:'#5a6278', blue:'#3b82f6', teal:'#22d3a5' };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1e2535', border:'0.5px solid rgba(255,255,255,0.14)', borderRadius:6, padding:'8px 12px', fontSize:12 }}>
      <div style={{ color:C.text3, marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, fontVariantNumeric:'tabular-nums' }}>
          {p.name}: {p.name.toLowerCase().includes('costo') ? `$${p.value}` : p.value}
        </div>
      ))}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px' }}>
      <div style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase', marginBottom:12 }}>{title}</div>
      {children}
    </div>
  );
}

export default function GraficasPanel({ porHora, loading }) {
  const placeholder = (
    <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:C.text3 }}>
      Cargando…
    </div>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1rem' }}>
      <Panel title="Llamadas por hora">
        {loading ? placeholder : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={porHora} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hora" tick={{ fontSize:10, fill:C.text3 }} />
              <YAxis tick={{ fontSize:10, fill:C.text3 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Llamadas" fill={C.blue} fillOpacity={0.7} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel title="Costo acumulado">
        {loading ? placeholder : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={porHora} margin={{ top:4, right:4, left:-10, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hora" tick={{ fontSize:10, fill:C.text3 }} />
              <YAxis tick={{ fontSize:10, fill:C.text3 }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="costo" name="Costo $" stroke={C.teal} strokeWidth={2} dot={{ r:3, fill:C.teal }} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  );
}
