'use client';
// components/AztecaDashboard.jsx
// Dashboard específico para datos de Azteca/Vicidial

import { useState, useEffect, useCallback } from 'react';
import useFechaUrl from './useFechaUrl';
import NavTabs          from './NavTabs';
import AztecaTabla       from './AztecaTabla';
import ModalAztecaRec    from './ModalAztecaRec';

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
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0,10);
}

function SectionLabel({ children }) {
  return <div style={{ fontSize:10, letterSpacing:'0.15em', color:C.text3, textTransform:'uppercase', marginBottom:8 }}>{children}</div>;
}

// ── KPI Card ────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color }} />
      <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize:22, fontWeight:700, color:C.text1, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.text2, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ── Barra de estado ──────────────────────────────────────────
function BarraEstado({ label, valor, total, color }) {
  const pct = total > 0 ? Math.round((valor/total)*100) : 0;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.text2, marginBottom:4 }}>
        <span>{label}</span>
        <span style={{ color:C.text1, fontWeight:600 }}>{valor.toLocaleString()} <span style={{ color:C.text3, fontWeight:400 }}>({pct}%)</span></span>
      </div>
      <div style={{ background:C.bg3, borderRadius:2, height:5, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:2, width:`${pct}%`, background:color, transition:'width .8s ease' }} />
      </div>
    </div>
  );
}

// ── Panel de campaña ─────────────────────────────────────────
function CampanaCard({ data }) {
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:600, color:C.text1 }}>{data.campania}</span>
        <span style={{ fontSize:11, color:C.text3 }}>{data.total.toLocaleString()} registros</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        {[
          { label:'Números únicos', value:data.nums_unicos, color:C.blue },
          { label:'Contestadas',    value:data.contestadas, color:C.teal },
          { label:'Promesas pago',  value:data.promesas,    color:C.green },
          { label:'Pagos',          value:data.pagos,       color:C.amber },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:C.bg3, borderRadius:6, padding:'8px 10px' }}>
            <div style={{ fontSize:9, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
            <div style={{ fontSize:16, fontWeight:700, color, fontVariantNumeric:'tabular-nums', marginTop:2 }}>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:11, color:C.text2, display:'flex', alignItems:'center', gap:6 }}>
        <span>Tasa contactación:</span>
        <span style={{ color: data.tasa_contactacion > 20 ? C.green : C.amber, fontWeight:600 }}>
          {data.tasa_contactacion}%
        </span>
      </div>
    </div>
  );
}

export default function AztecaDashboard({ user }) {
  const { desde, hasta, rangoActivo, setDesde, setHasta, setRango, setRangoActivo, hoy } = useFechaUrl();
  const [campanaFiltro, setCampanaFiltro] = useState('');
  const [kpis, setKpis]               = useState(null);
  const [llamadas, setLlamadas]       = useState([]);
  const [campanas, setCampanas]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [clock, setClock]             = useState('');
  const [numeroModal, setNumeroModal] = useState(null);

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

      const [rKpis, rLlamadas, rCampanas] = await Promise.all([
        fetch(`/api/azteca/kpis?${params}`),
        fetch(`/api/azteca/llamadas?${params}&limit=500`),
        fetch(`/api/azteca/campanas?desde=${desde}&hasta=${hasta}`),
      ]);
      if (rKpis.status === 401) { window.location.href = '/'; return; }
      setKpis(await rKpis.json());
      setLlamadas(await rLlamadas.json());
      setCampanas(await rCampanas.json());
    } catch {
      setError('Error al cargar datos de Azteca.');
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, campanaFiltro]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const aplicarRango = (r) => {
    if (r.label === 'Ayer') { const a = fechaOffset(1); setRango(a, a, r.label); }
    else { setRango(fechaOffset(r.dias), hoy, r.label); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/';
  };

  const inp = { background:C.bg2, border:`0.5px solid ${C.b2}`, borderRadius:4, color:C.text1, fontSize:12, padding:'5px 8px', fontFamily:FONT, outline:'none' };
  const esRango = desde !== hasta;
  const rolColor = { admin:'#22d3a5', supervisor:'#3b82f6', campana:'#f59e0b' };

  return (
    <div style={{ background:C.bg, minHeight:'100vh', padding:'1.25rem', fontFamily:FONT, color:C.text1 }}>

      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.teal, animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:13, fontWeight:600, letterSpacing:'0.12em', color:C.text2, textTransform:'uppercase' }}>
            ViciTarif <span style={{ fontSize:11, color:C.text3 }}>· Azteca</span>
          </span>
          <span style={{ fontSize:11, color:C.text3 }}>{user.nombre}</span>
          <NavTabs />
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:3, background:`${rolColor[user.role]||C.text3}22`, color:rolColor[user.role]||C.text3, border:`0.5px solid ${rolColor[user.role]||C.text3}44` }}>
            {user.role}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.teal, background:'rgba(34,211,165,0.1)', border:'0.5px solid rgba(34,211,165,0.3)', padding:'4px 10px', borderRadius:4 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:C.teal, display:'inline-block' }} /> En vivo
          </div>
          <span style={{ fontSize:12, color:C.text3 }}>{clock}</span>
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
        {/* Filtro por campaña */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
          <span style={{ fontSize:11, color:C.text3 }}>Campaña</span>
          <select value={campanaFiltro} onChange={e => setCampanaFiltro(e.target.value)} style={{ ...inp, width:120 }}>
            <option value="">Todas</option>
            <option value="CPBAZ">CPBAZ</option>
            <option value="IVRB01">IVRB01</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.1)', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#f87171', marginBottom:12 }}>⚠ {error}</div>
      )}

      {/* KPIs principales */}
      <SectionLabel>KPIs {esRango ? `del ${desde} al ${hasta}` : `del ${desde}`} {campanaFiltro ? `— ${campanaFiltro}` : ''}</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1rem' }}>
        <KpiCard label="Total registros"    value={loading?'…':(kpis?.total||0).toLocaleString()}          color={C.blue}   icon="📋" />
        <KpiCard label="Números únicos"     value={loading?'…':(kpis?.nums_unicos||0).toLocaleString()}     color={C.purple} icon="📱" />
        <KpiCard label="Contactación"       value={loading?'…':`${kpis?.tasa_contactacion||0}%`}            color={C.teal}   icon="✅" sub={`${(kpis?.contestadas||0).toLocaleString()} contestadas`} />
        <KpiCard label="Promesas de pago"   value={loading?'…':(kpis?.promesas||0).toLocaleString()}        color={C.green}  icon="💰" sub={`${kpis?.tasa_promesa||0}% de contactados`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1rem' }}>
        <KpiCard label="Pagos reportados"  value={loading?'…':(kpis?.pagos||0).toLocaleString()}           color={C.amber}  icon="💵" />
        <KpiCard label="Buzón / Answering" value={loading?'…':(kpis?.buzon||0).toLocaleString()}           color={C.text3}  icon="📭" />
        <KpiCard label="No contesta"       value={loading?'…':(kpis?.no_contesta||0).toLocaleString()}     color={C.red}    icon="🚫" />
        <KpiCard label="Negativas"         value={loading?'…':(kpis?.negativas||0).toLocaleString()}       color={C.red}    icon="❌" />
      </div>

      {/* Desglose por SDA y por campaña */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1rem' }}>

        {/* Desglose SDA */}
        <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:C.text2, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Resultado SDA de la llamada</div>
          {loading ? <span style={{ fontSize:12, color:C.text3 }}>Cargando…</span> : kpis && (
            <>
              <BarraEstado label="Contestada (ANSWERED)"  valor={kpis.contestadas}   total={kpis.total} color={C.teal}   />
              <BarraEstado label="No contestó (NO ANSWER)" valor={kpis.no_answer_sda} total={kpis.total} color={C.amber}  />
              <BarraEstado label="Fallo / Ocupado"         valor={kpis.fallidas}      total={kpis.total} color={C.red}    />
            </>
          )}
        </div>

        {/* Desglose resultado agente */}
        <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:C.text2, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Resultado de gestión</div>
          {loading ? <span style={{ fontSize:12, color:C.text3 }}>Cargando…</span> : kpis && (
            <>
              <BarraEstado label="Promesa de pago"  valor={kpis.promesas}    total={kpis.total} color={C.green}  />
              <BarraEstado label="Pago reportado"   valor={kpis.pagos}       total={kpis.total} color={C.amber}  />
              <BarraEstado label="Negativa de pago" valor={kpis.negativas}   total={kpis.total} color={C.red}    />
              <BarraEstado label="Buzón/Answering"  valor={kpis.buzon}       total={kpis.total} color={C.text3}  />
              <BarraEstado label="No contesta"      valor={kpis.no_contesta} total={kpis.total} color={C.purple} />
            </>
          )}
        </div>
      </div>

      {/* Por campaña */}
      {campanas.length > 0 && (
        <>
          <SectionLabel>Por campaña</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:'1rem' }}>
            {campanas.map(c => <CampanaCard key={c.campania} data={c} />)}
          </div>
        </>
      )}

      {/* Tabla de registros */}
      <SectionLabel>Registros de gestión</SectionLabel>
      <AztecaTabla
        llamadas={llamadas}
        loading={loading}
        desde={desde}
        hasta={hasta}
        campana={campanaFiltro}
        onVerRecurrencia={setNumeroModal}
      />

      {/* Modal recurrencia */}
      {numeroModal && (
        <ModalAztecaRec
          numero={numeroModal}
          desde={desde}
          hasta={hasta}
          onClose={() => setNumeroModal(null)}
        />
      )}

      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:`0.5px solid ${C.border}`, marginTop:8 }}>
        <span style={{ fontSize:10, color:C.text3 }}>ViciTarif · Azteca · PostgreSQL</span>
        <span style={{ fontSize:10, color:C.green, display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:C.green, display:'inline-block' }} /> Conectado
        </span>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
