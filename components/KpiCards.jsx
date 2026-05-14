'use client';
// components/KpiCards.jsx

const C = { bg2:'#161b27', border:'rgba(255,255,255,0.08)', text1:'#e8eaf0', text2:'#8b93a8', text3:'#5a6278', green:'#22c55e', red:'#ef4444' };

function aht(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

function KpiCard({ label, value, sub, arrow, color }) {
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color, opacity:.85 }} />
      <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:C.text1, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:C.text2, marginTop:5, display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ color: arrow==='up' ? C.green : C.red }}>{arrow==='up'?'▲':'▼'}</span>
        {sub}
      </div>
    </div>
  );
}

export default function KpiCards({ kpis, loading }) {
  const v = val => loading ? '…' : val;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1rem' }}>
      <KpiCard label="Total llamadas"    value={v((kpis?.totalLlamadas ?? 0).toLocaleString())}   color="#3b82f6" arrow="up" sub="vs ayer" />
      <KpiCard label="Costo total"       value={v(`$${(kpis?.costoTotal ?? 0).toFixed(2)}`)}       color="#22d3a5" arrow="up" sub="del día" />
      <KpiCard label="AHT promedio"      value={v(aht(kpis?.ahtSeg ?? 0))}                         color="#f59e0b" arrow="dn" sub="min:seg" />
      <KpiCard label="Llamadas perdidas" value={v((kpis?.llamadasPerdidas ?? 0).toLocaleString())} color="#ef4444" arrow="dn" sub={`${kpis?.dropRate ?? 0}% drop rate`} />
    </div>
  );
}
