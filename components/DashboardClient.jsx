'use client';
import { useState, useEffect, useCallback } from 'react';
import KpiCards      from './KpiCards';
import CallTable     from './CallTable';
import GraficasPanel from './GraficasPanel';

const C = {
  bg:'#0f1117', bg2:'#161b27', border:'rgba(255,255,255,0.08)',
  b2:'rgba(255,255,255,0.14)', text1:'#e8eaf0', text2:'#8b93a8',
  text3:'#5a6278', teal:'#22d3a5', blue:'#3b82f6', green:'#22c55e',
};
const FONT = "'JetBrains Mono','Fira Code',monospace";
const COLORS = ['#3b82f6','#22d3a5','#f59e0b','#a78bfa','#ef4444'];

function SectionLabel({ children }) {
  return <div style={{ fontSize:10, letterSpacing:'0.15em', color:C.text3, textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>{children}</div>;
}

function CampanasBars({ campanas, loading }) {
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px' }}>
      <div style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase', marginBottom:12 }}>Costo por campaña</div>
      {loading ? <span style={{ fontSize:12, color:C.text3 }}>Cargando…</span>
        : campanas.length === 0 ? <span style={{ fontSize:12, color:C.text3 }}>Sin datos</span>
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

// Atajos de rango rápido
const RANGOS = [
  { label:'Hoy',        dias:0  },
  { label:'Ayer',       dias:1  },
  { label:'7 días',     dias:6  },
  { label:'15 días',    dias:14 },
  { label:'30 días',    dias:29 },
];

function fechaOffset(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0,10);
}

export default function DashboardClient({ user }) {
  const hoy = new Date().toISOString().slice(0,10);
  const [desde, setDesde]           = useState(hoy);
  const [hasta, setHasta]           = useState(hoy);
  const [rangoActivo, setRangoActivo] = useState('Hoy');
  const [kpis, setKpis]             = useState(null);
  const [llamadas, setLlamadas]     = useState([]);
  const [porHora, setPorHora]       = useState([]);
  const [porCampana, setPorCampana] = useState([]);
  const [porDia, setPorDia]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [clock, setClock]           = useState('');

  const campanaFiltro = user.role === 'campana' ? user.campana : null;

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
      if (campanaFiltro) params.set('campana', campanaFiltro);

      const [rKpis, rLlamadas, rHora, rCampana, rDia] = await Promise.all([
        fetch(`/api/kpis?${params}`),
        fetch(`/api/llamadas?${params}&limit=500`),
        fetch(`/api/por-hora?${params}`),
        fetch(`/api/por-campana?${params}`),
        fetch(`/api/por-dia?${params}`),
      ]);
      if (rKpis.status === 401) { window.location.href = '/'; return; }
      setKpis(await rKpis.json());
      setLlamadas(await rLlamadas.json());
      setPorHora(await rHora.json());
      setPorCampana(await rCampana.json());
      setPorDia(await rDia.json());
    } catch {
      setError('Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, campanaFiltro]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/';
  };

  const aplicarRango = (rango) => {
    setRangoActivo(rango.label);
    if (rango.label === 'Ayer') {
      const ayer = fechaOffset(1);
      setDesde(ayer); setHasta(ayer);
    } else {
      setDesde(fechaOffset(rango.dias));
      setHasta(hoy);
    }
  };

  const rolColor = { admin:'#22d3a5', supervisor:'#3b82f6', campana:'#f59e0b' };

  const inp = {
    background:C.bg2, border:`0.5px solid ${C.b2}`, borderRadius:4,
    color:C.text1, fontSize:12, padding:'5px 8px', fontFamily:FONT, outline:'none',
  };

  const esRango = desde !== hasta;
  const labelRango = esRango ? `${desde} → ${hasta}` : desde;

  return (
    <div style={{ background:C.bg, minHeight:'100vh', padding:'1.25rem', fontFamily:FONT, color:C.text1 }}>

      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, fontWeight:600, letterSpacing:'0.12em', color:C.text2, textTransform:'uppercase' }}>
            ViciTarif <span style={{ fontSize:11, color:C.text3 }}>v2.0</span>
          </span>
          <span style={{ fontSize:11, color:C.text3 }}>{user.nombre}</span>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:3, background:`${rolColor[user.role]||C.text3}22`, color:rolColor[user.role]||C.text3, border:`0.5px solid ${rolColor[user.role]||C.text3}44` }}>
            {user.role === 'campana' ? `📋 ${user.campana}` : user.role}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:C.text3, fontVariantNumeric:'tabular-nums' }}>{clock}</span>
          <button onClick={handleLogout} style={{ background:'transparent', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:4, color:'#f87171', fontSize:11, padding:'5px 10px', cursor:'pointer', fontFamily:FONT }}>Salir</button>
        </div>
      </div>

      {/* Selector de rango de fechas */}
      <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'12px 16px', marginBottom:'1rem', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        {/* Atajos rápidos */}
        <div style={{ display:'flex', gap:6 }}>
          {RANGOS.map(r => (
            <button key={r.label} onClick={() => aplicarRango(r)}
              style={{
                background: rangoActivo===r.label ? C.blue : 'transparent',
                border: `0.5px solid ${rangoActivo===r.label ? C.blue : C.b2}`,
                borderRadius:4, color: rangoActivo===r.label ? '#fff' : C.text2,
                fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:FONT,
                transition:'all .2s',
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div style={{ width:'0.5px', height:20, background:C.border, marginLeft:'auto' }} />

        {/* Fechas manuales */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:C.text3 }}>Desde</span>
          <input type="date" value={desde}
            onChange={e => { setDesde(e.target.value); setRangoActivo(''); }}
            style={inp} />
          <span style={{ fontSize:11, color:C.text3 }}>Hasta</span>
          <input type="date" value={hasta}
            onChange={e => { setHasta(e.target.value); setRangoActivo(''); }}
            style={inp} />
          <button onClick={fetchAll}
            style={{ background:C.blue, border:'none', borderRadius:4, color:'#fff', fontSize:11, padding:'5px 12px', cursor:'pointer', fontFamily:FONT }}>
            Aplicar
          </button>
        </div>

      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.1)', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#f87171', marginBottom:12 }}>⚠ {error}</div>
      )}

      <SectionLabel>KPIs {esRango ? `del ${desde} al ${hasta}` : `del ${desde}`} {campanaFiltro ? `— ${campanaFiltro}` : ''}</SectionLabel>
      <KpiCards kpis={kpis} loading={loading} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1rem' }}>
        <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px' }}>
          <div style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase', marginBottom:12 }}>Distribución por tipo</div>
          {[
            { key:'local',         label:'Local',           color:'#60a5fa' },
            { key:'larga_dist',    label:'Larga distancia', color:'#34d399' },
            { key:'celular',       label:'Celular',         color:'#fbbf24' },
            { key:'voip',          label:'VoIP / SIP',      color:'#c4b5fd' },
            { key:'internacional', label:'Internacional',   color:'#f87171' },
          ].map(r => (
            <div key={r.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:`0.5px solid ${C.border}` }}>
              <span style={{ fontSize:12, color:C.text2, display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:r.color }} />{r.label}
              </span>
              <span style={{ fontSize:12, color:C.text3 }}>
                {loading ? '…' : llamadas.filter(l=>l.tipo===r.key).length} llamadas
              </span>
            </div>
          ))}
        </div>
        <CampanasBars campanas={porCampana} loading={loading} />
      </div>

      <SectionLabel>Registro de llamadas</SectionLabel>
      <CallTable llamadas={llamadas} loading={loading} desde={desde} hasta={hasta} campana={campanaFiltro} />

      <GraficasPanel porHora={porHora} porDia={porDia} loading={loading} esRango={esRango} />

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
