'use client';
// components/DashboardClient.jsx
import { useState, useEffect, useCallback } from 'react';
import KpiCards      from './KpiCards';
import CallTable     from './CallTable';
import Calculadora   from './Calculadora';
import TarifasPanel  from './TarifasPanel';
import GraficasPanel from './GraficasPanel';

const C = { bg:'#0f1117', bg2:'#161b27', border:'rgba(255,255,255,0.08)', b2:'rgba(255,255,255,0.14)', text1:'#e8eaf0', text2:'#8b93a8', text3:'#5a6278', teal:'#22d3a5', blue:'#3b82f6', green:'#22c55e' };
const FONT = "'JetBrains Mono','Fira Code',monospace";
const COLORS = ['#3b82f6','#22d3a5','#f59e0b','#a78bfa','#ef4444'];

function SectionLabel({ children }) {
  return <div style={{ fontSize:10, letterSpacing:'0.15em', color:C.text3, textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>{children}</div>;
}

function TarifasDistribucion({ tarifas }) {
  const tipos = [
    { key:'local',         label:'Local',           color:'#60a5fa' },
    { key:'larga_dist',    label:'Larga distancia',  color:'#34d399' },
    { key:'celular',       label:'Celular',           color:'#fbbf24' },
    { key:'voip',          label:'VoIP / SIP',        color:'#c4b5fd' },
    { key:'internacional', label:'Internacional',     color:'#f87171' },
  ];
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px' }}>
      <div style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase', marginBottom:12 }}>Distribución por tipo</div>
      {tipos.map(r => (
        <div key={r.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:`0.5px solid ${C.border}` }}>
          <span style={{ fontSize:12, color:C.text2, display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:r.color, flexShrink:0 }} />
            {r.label}
          </span>
          <span style={{ fontSize:12, color:C.text3, fontVariantNumeric:'tabular-nums' }}>
            ${(tarifas[r.key]||0).toFixed(3)}/min
          </span>
        </div>
      ))}
    </div>
  );
}

function CampanasBars({ campanas, loading }) {
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px' }}>
      <div style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase', marginBottom:12 }}>Costo por campaña</div>
      {loading
        ? <span style={{ fontSize:12, color:C.text3 }}>Cargando…</span>
        : campanas.map((c,i) => {
            const max = campanas[0]?.costo || 1;
            return (
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.text2, marginBottom:4 }}>
                  <span>{c.campana}</span><span>${c.costo.toFixed(2)}</span>
                </div>
                <div style={{ background:'#1e2535', borderRadius:2, height:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:2, width:`${Math.round((c.costo/max)*100)}%`, background:COLORS[i%5], transition:'width .8s ease' }} />
                </div>
              </div>
            );
          })
      }
    </div>
  );
}

export default function DashboardClient({ user }) {
  const [fecha, setFecha]           = useState(new Date().toISOString().slice(0,10));
  const [kpis, setKpis]             = useState(null);
  const [llamadas, setLlamadas]     = useState([]);
  const [porHora, setPorHora]       = useState([]);
  const [porCampana, setPorCampana] = useState([]);
  const [tarifas, setTarifas]       = useState({ local:0.012, larga_dist:0.045, celular:0.035, voip:0.008, internacional:0.120, fuera_horario:0.20 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [clock, setClock]           = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('es-MX', { hour12:false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [rKpis, rLlamadas, rHora, rCampana, rTarifas] = await Promise.all([
        fetch(`/api/kpis?fecha=${fecha}`),
        fetch(`/api/llamadas?fecha=${fecha}&limit=50`),
        fetch(`/api/por-hora?fecha=${fecha}`),
        fetch(`/api/por-campana?fecha=${fecha}`),
        fetch('/api/tarifas'),
      ]);
      if (rKpis.status === 401) { window.location.href = '/'; return; }
      setKpis(await rKpis.json());
      setLlamadas(await rLlamadas.json());
      setPorHora(await rHora.json());
      setPorCampana(await rCampana.json());
      setTarifas(await rTarifas.json());
    } catch {
      setError('Error al cargar datos. Verifica la conexión con la BD.');
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/';
  };

  const saveTarifas = async (nuevas) => {
    const res = await fetch('/api/tarifas', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(nuevas) });
    if (res.ok) setTarifas(nuevas);
    return res.ok;
  };

  const topbarInput = { background:C.bg2, border:`0.5px solid ${C.b2}`, borderRadius:4, color:C.text1, fontSize:12, padding:'5px 8px', fontFamily:FONT, outline:'none' };

  return (
    <div style={{ background:C.bg, minHeight:'100vh', padding:'1.25rem', fontFamily:FONT, color:C.text1 }}>

      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.teal, animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:13, fontWeight:600, letterSpacing:'0.12em', color:C.text2, textTransform:'uppercase' }}>
            ViciTarif <span style={{ fontSize:11, color:C.text3 }}>v2.4</span>
          </span>
          <span style={{ fontSize:11, color:C.text3, marginLeft:8 }}>{user.nombre} · {user.role}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={topbarInput} />
          <button onClick={fetchAll} style={{ background:'transparent', border:`0.5px solid ${C.b2}`, borderRadius:4, color:C.text2, fontSize:11, padding:'5px 10px', cursor:'pointer', fontFamily:FONT }}>↻ Actualizar</button>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.teal, background:'rgba(34,211,165,0.1)', border:'0.5px solid rgba(34,211,165,0.3)', padding:'4px 10px', borderRadius:4 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:C.teal, display:'inline-block' }} /> En vivo
          </div>
          <span style={{ fontSize:12, color:C.text3, fontVariantNumeric:'tabular-nums' }}>{clock}</span>
          <button onClick={handleLogout} style={{ background:'transparent', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:4, color:'#f87171', fontSize:11, padding:'5px 10px', cursor:'pointer', fontFamily:FONT }}>Salir</button>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.1)', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#f87171', marginBottom:12 }}>
          ⚠ {error}
        </div>
      )}

      <SectionLabel>KPIs del día</SectionLabel>
      <KpiCards kpis={kpis} loading={loading} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1rem' }}>
        <TarifasDistribucion tarifas={tarifas} />
        <CampanasBars campanas={porCampana} loading={loading} />
      </div>

      <SectionLabel>Configuración de tarifas</SectionLabel>
      <TarifasPanel tarifas={tarifas} onSave={saveTarifas} isAdmin={user.role === 'admin'} />

      <SectionLabel>Calculadora de tarificación</SectionLabel>
      <Calculadora tarifas={tarifas} />

      <SectionLabel>Últimas llamadas</SectionLabel>
      <CallTable llamadas={llamadas} loading={loading} />

      <GraficasPanel porHora={porHora} loading={loading} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:`0.5px solid ${C.border}`, marginTop:8 }}>
        <span style={{ fontSize:10, color:C.text3 }}>Vicidial · MySQL · Next.js App Router</span>
        <span style={{ fontSize:10, color:C.green, display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:C.green, display:'inline-block' }} /> SQL conectado
        </span>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
