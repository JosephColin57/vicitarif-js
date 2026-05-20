'use client';
import { useState, useEffect, useCallback } from 'react';
import useFechaUrl from './useFechaUrl';
import NavTabs from './NavTabs';
import GraficasPanel from './GraficasPanel';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const C = {
  bg:'#0f1117', bg2:'#161b27', bg3:'#1e2535',
  border:'rgba(255,255,255,0.08)', b2:'rgba(255,255,255,0.14)',
  text1:'#e8eaf0', text2:'#8b93a8', text3:'#5a6278',
  teal:'#22d3a5', blue:'#3b82f6', green:'#22c55e',
  amber:'#f59e0b', red:'#ef4444', purple:'#a78bfa',
};
const FONT = "'JetBrains Mono','Fira Code',monospace";

const RANGOS = [
  { label:'Hoy',     dias:0  },
  { label:'Ayer',    dias:1  },
  { label:'7 días',  dias:6  },
  { label:'15 días', dias:14 },
  { label:'30 días', dias:29 },
];

function fechaOffset(dias) {
  const d = new Date(); d.setDate(d.getDate()-dias);
  return d.toISOString().slice(0,10);
}

function SectionLabel({ children }) {
  return <div style={{ fontSize:10, letterSpacing:'0.15em', color:C.text3, textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>{children}</div>;
}

// ── KPI Card ────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color }} />
      <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{icon} {label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:C.text1, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.text2, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ── Tabla resumen por campaña ────────────────────────────────
function TablaCampanas({ campanas, loading }) {
  if (loading) return <div style={{ fontSize:12, color:C.text3, padding:'20px 0' }}>Cargando…</div>;
  if (!campanas.length) return <div style={{ fontSize:12, color:C.text3, padding:'20px 0' }}>Sin datos para este rango</div>;

  const TH = { fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 14px', textAlign:'left', borderBottom:`0.5px solid ${C.border}`, fontWeight:500, whiteSpace:'nowrap' };
  const TD = { padding:'10px 14px', borderBottom:`0.5px solid ${C.border}`, fontSize:12, fontVariantNumeric:'tabular-nums' };

  const maxTotal = campanas[0]?.total || 1;

  return (
    <div style={{ border:`0.5px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            {['Campaña','Registros','Núms únicos','Contactación','Promesas','Pagos','No contesta','Buzón'].map(h =>
              <th key={h} style={TH}>{h}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {campanas.map((c,i) => {
            const pct = Math.round((c.total/maxTotal)*100);
            return (
              <tr key={i}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ ...TD, color:C.text1, fontWeight:600 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:pct+'%', maxWidth:60, height:3, background:C.blue, borderRadius:2 }} />
                    {c.campania}
                  </div>
                </td>
                <td style={{ ...TD, color:C.text1 }}>{c.total.toLocaleString()}</td>
                <td style={{ ...TD, color:C.text2 }}>{c.nums_unicos.toLocaleString()}</td>
                <td style={TD}>
                  <span style={{ color: c.tasa_contactacion>=25?C.green:c.tasa_contactacion>=15?C.amber:C.red, fontWeight:600 }}>
                    {c.tasa_contactacion}%
                  </span>
                  <span style={{ color:C.text3, marginLeft:4, fontSize:11 }}>({c.contestadas.toLocaleString()})</span>
                </td>
                <td style={{ ...TD, color:C.green, fontWeight:600 }}>{c.promesas.toLocaleString()}</td>
                <td style={{ ...TD, color:C.amber, fontWeight:600 }}>{c.pagos.toLocaleString()}</td>
                <td style={{ ...TD, color:C.text2 }}>{c.no_contesta.toLocaleString()}</td>
                <td style={{ ...TD, color:C.text3 }}>{c.buzon.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tooltip gráfica ──────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.bg3, border:`0.5px solid ${C.b2}`, borderRadius:6, padding:'8px 12px', fontSize:12 }}>
      <div style={{ color:C.text3, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontVariantNumeric:'tabular-nums' }}>
          {p.name}: {p.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────
export default function DashboardClient({ user }) {
  const { desde, hasta, rangoActivo, setDesde, setHasta, setRango, setRangoActivo, hoy } = useFechaUrl();
  const [kpis, setKpis]               = useState(null);
  const [campanas, setCampanas]       = useState([]);
  const [tendencia, setTendencia]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [clock, setClock]             = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('es-MX', { hour12:false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ desde, hasta });
      const [rKpis, rCampanas, rTendencia] = await Promise.all([
        fetch(`/api/general/kpis?${params}`),
        fetch(`/api/general/campanas?${params}`),
        fetch(`/api/general/tendencia?${params}`),
      ]);
      if (rKpis.status === 401) { window.location.href = '/'; return; }
      setKpis(await rKpis.json());
      setCampanas(await rCampanas.json());
      setTendencia(await rTendencia.json());
    } catch {
      setError('Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/';
  };

  const aplicarRango = (r) => {
    if (r.label==='Ayer') { const a=fechaOffset(1); setRango(a, a, r.label); }
    else { setRango(fechaOffset(r.dias), hoy, r.label); }
  };

  const inp = { background:C.bg2, border:`0.5px solid ${C.b2}`, borderRadius:4, color:C.text1, fontSize:12, padding:'5px 8px', fontFamily:FONT, outline:'none' };
  const esRango = desde !== hasta;
  const rolColor = { admin:'#22d3a5', supervisor:'#3b82f6', campana:'#f59e0b' };
  const v = val => loading ? '…' : val;

  return (
    <div style={{ background:C.bg, minHeight:'100vh', padding:'1.25rem', fontFamily:FONT, color:C.text1 }}>

      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.teal, animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:13, fontWeight:600, letterSpacing:'0.12em', color:C.text2, textTransform:'uppercase' }}>
            ViciTarif <span style={{ fontSize:11, color:C.text3 }}>v2.4</span>
          </span>
          <span style={{ fontSize:11, color:C.text3 }}>{user.nombre}</span>
          <NavTabs />
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:3, background:`${rolColor[user.role]||C.text3}22`, color:rolColor[user.role]||C.text3, border:`0.5px solid ${rolColor[user.role]||C.text3}44` }}>
            {user.role}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:C.text3, fontVariantNumeric:'tabular-nums' }}>{clock}</span>
          <button onClick={handleLogout} style={{ background:'transparent', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:4, color:'#f87171', fontSize:11, padding:'5px 10px', cursor:'pointer', fontFamily:FONT }}>Salir</button>
        </div>
      </div>

      {/* Selector de rango */}
      <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'12px 16px', marginBottom:'1rem', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6 }}>
          {RANGOS.map(r => (
            <button key={r.label} onClick={() => aplicarRango(r)} style={{
              background: rangoActivo===r.label ? C.blue : 'transparent',
              border:`0.5px solid ${rangoActivo===r.label ? C.blue : C.b2}`,
              borderRadius:4, color:rangoActivo===r.label?'#fff':C.text2,
              fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:FONT,
            }}>{r.label}</button>
          ))}
        </div>
        <div style={{ width:'0.5px', height:20, background:C.border }} />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:C.text3 }}>Desde</span>
          <input type="date" value={desde} onChange={e => { setDesde(e.target.value); setRangoActivo(''); }} style={inp} />
          <span style={{ fontSize:11, color:C.text3 }}>Hasta</span>
          <input type="date" value={hasta} onChange={e => { setHasta(e.target.value); setRangoActivo(''); }} style={inp} />
          <button onClick={fetchAll} style={{ background:C.blue, border:'none', borderRadius:4, color:'#fff', fontSize:11, padding:'5px 12px', cursor:'pointer', fontFamily:FONT }}>Aplicar</button>
        </div>

      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.1)', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#f87171', marginBottom:12 }}>⚠ {error}</div>
      )}

      {/* KPIs fila 1 — volumen */}
      <SectionLabel>Resumen ejecutivo {esRango ? `· ${desde} al ${hasta}` : `· ${desde}`}</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
        <KpiCard icon="📋" label="Total registros"    color={C.blue}   value={v((kpis?.total||0).toLocaleString())}          sub={`${kpis?.total_campanas||0} campañas activas`} />
        <KpiCard icon="📱" label="Números únicos"     color={C.purple} value={v((kpis?.nums_unicos||0).toLocaleString())}     sub="en gestión" />
        <KpiCard icon="✅" label="Tasa contactación"  color={C.teal}   value={v(`${kpis?.tasa_contactacion||0}%`)}            sub={`${(kpis?.contestadas||0).toLocaleString()} contestadas`} />
        <KpiCard icon="💰" label="Promesas de pago"   color={C.green}  value={v((kpis?.promesas||0).toLocaleString())}        sub={`${kpis?.tasa_promesa||0}% de contactados`} />
      </div>

      {/* KPIs fila 2 — resultados */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1rem' }}>
        <KpiCard icon="💵" label="Pagos reportados"   color={C.amber}  value={v((kpis?.pagos||0).toLocaleString())}           />
        <KpiCard icon="❌" label="Negativas"           color={C.red}    value={v((kpis?.negativas||0).toLocaleString())}       />
        <KpiCard icon="🚫" label="No contesta"         color={C.red}    value={v((kpis?.no_contesta||0).toLocaleString())}     />
        <KpiCard icon="📭" label="Buzón / Answering"   color={C.text3}  value={v((kpis?.buzon||0).toLocaleString())}           />
      </div>

      {/* Tabla por campaña */}
      <SectionLabel>Resumen por campaña</SectionLabel>
      <div style={{ marginBottom:'1rem' }}>
        <TablaCampanas campanas={campanas} loading={loading} />
      </div>

      {/* Gráfica de tendencia (solo si hay rango) */}
      {tendencia.length > 1 && (
        <>
          <SectionLabel>Tendencia diaria</SectionLabel>
          <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px', marginBottom:'1rem' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tendencia} margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="fecha" tick={{ fontSize:10, fill:C.text3 }} tickFormatter={v=>v.slice(5)} />
                <YAxis tick={{ fontSize:10, fill:C.text3 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:11, color:C.text3, paddingTop:8 }} />
                <Bar dataKey="total"       name="Total"     fill={C.blue}  fillOpacity={0.6} radius={[2,2,0,0]} />
                <Bar dataKey="contestadas" name="Contactadas" fill={C.teal}  fillOpacity={0.8} radius={[2,2,0,0]} />
                <Bar dataKey="promesas"    name="Promesas"  fill={C.green} fillOpacity={0.9} radius={[2,2,0,0]} />
                <Bar dataKey="pagos"       name="Pagos"     fill={C.amber} fillOpacity={0.9} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:`0.5px solid ${C.border}`, marginTop:8 }}>
        <span style={{ fontSize:10, color:C.text3 }}>ViciTarif · PostgreSQL · Next.js</span>
        <span style={{ fontSize:10, color:C.green, display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:C.green, display:'inline-block' }} /> Conectado
        </span>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
