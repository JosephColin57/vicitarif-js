'use client';
// components/ModalAztecaRec.jsx
import { useState, useEffect, useCallback } from 'react';

const C = {
  bg2:'#161b27', bg3:'#1e2535',
  border:'rgba(255,255,255,0.08)', b2:'rgba(255,255,255,0.14)',
  text1:'#e8eaf0', text2:'#8b93a8', text3:'#5a6278',
  blue:'#3b82f6', teal:'#22d3a5', green:'#22c55e',
  amber:'#f59e0b', red:'#ef4444',
};
const FONT = "'JetBrains Mono','Fira Code',monospace";

function estadoColor(s) {
  if (!s) return { bg:'rgba(255,255,255,0.05)', color:'#8b93a8' };
  const l = s.toLowerCase();
  if (l.includes('promesa'))                        return { bg:'rgba(34,197,94,0.12)',   color:'#4ade80' };
  if (l.includes('pago') && !l.includes('promesa')) return { bg:'rgba(245,158,11,0.12)',  color:'#fbbf24' };
  if (l.includes('negativa') || l.includes('drop')) return { bg:'rgba(239,68,68,0.12)',   color:'#f87171' };
  if (l.includes('answering') || l.includes('buzon')) return { bg:'rgba(100,116,139,0.15)', color:'#94a3b8' };
  if (l.includes('contacto') || l.includes('habla')) return { bg:'rgba(167,139,250,0.12)', color:'#c4b5fd' };
  return { bg:'rgba(255,255,255,0.05)', color:'#8b93a8' };
}

function sdaColor(s) {
  if (!s || s==='—') return { bg:'rgba(255,255,255,0.05)', color:'#5a6278' };
  const l = s.toLowerCase();
  if (l.includes('answered'))  return { bg:'rgba(34,211,165,0.12)',  color:'#22d3a5' };
  if (l.includes('no answer')) return { bg:'rgba(245,158,11,0.12)',  color:'#fbbf24' };
  if (l.includes('failed') || l.includes('busy')) return { bg:'rgba(239,68,68,0.12)', color:'#f87171' };
  return { bg:'rgba(255,255,255,0.05)', color:'#8b93a8' };
}

function Pill({ label, colorFn }) {
  const { bg, color } = colorFn(label);
  return <span style={{ fontSize:10, padding:'2px 7px', borderRadius:3, background:bg, color, whiteSpace:'nowrap', display:'inline-block' }}>{label||'—'}</span>;
}

const TH = { fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 12px', textAlign:'left', borderBottom:`0.5px solid ${C.border}`, fontWeight:500 };
const TD = { padding:'8px 12px', color:C.text2, borderBottom:`0.5px solid ${C.border}`, fontSize:12 };

export default function ModalAztecaRec({ numero, desde, hasta, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ numero, desde, hasta });
      const res    = await fetch(`/api/azteca/recurrencia?${params}`);
      const json   = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [numero, desde, hasta]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', zIndex:1000 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:C.bg2, border:`0.5px solid ${C.b2}`, borderRadius:12, width:'min(860px,95vw)', maxHeight:'88vh', display:'flex', flexDirection:'column', zIndex:1001, fontFamily:FONT, overflow:'hidden', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`0.5px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:C.teal }} />
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:C.text1 }}>📱 {numero}</div>
              <div style={{ fontSize:11, color:C.text3, marginTop:2 }}>
                Recurrencia Azteca · {desde === hasta ? desde : `${desde} → ${hasta}`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:`0.5px solid ${C.border}`, borderRadius:6, color:C.text2, fontSize:16, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT }}>✕</button>
        </div>

        {/* Contenido */}
        <div style={{ overflowY:'auto', flex:1, padding:'16px 20px' }}>

          {loading && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, fontSize:12, color:C.text3 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.1)', borderTop:`2px solid ${C.blue}`, borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                Cargando historial…
              </div>
            </div>
          )}

          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#f87171' }}>⚠ {error}</div>}

          {data && !loading && (
            <>
              {/* KPIs */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { label:'Total contactos', value:data.total, color:C.blue },
                  { label:'Estados distintos', value:data.resumen.length, color:C.teal },
                  { label:'Días contactado', value:data.historial.filter((h,i,a)=>a.findIndex(x=>x.fecha===h.fecha)===i).length, color:C.amber },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:C.bg3, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
                    <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:24, fontWeight:700, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Dos columnas: resumen estado + SDA */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>

                {/* Por estado */}
                <div>
                  <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Por resultado de gestión</div>
                  {data.resumen.map((r,i) => {
                    const max = data.resumen[0]?.total || 1;
                    const pct = Math.round((r.total/max)*100);
                    const { color } = estadoColor(r.status_name);
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                        <div style={{ width:170, flexShrink:0 }}><Pill label={r.status_name} colorFn={estadoColor} /></div>
                        <div style={{ flex:1, background:'#0f1117', borderRadius:2, height:5, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2 }} />
                        </div>
                        <span style={{ fontSize:12, color:C.text1, fontWeight:600, width:24, textAlign:'right' }}>{r.total}</span>
                        <span style={{ fontSize:10, color:C.text3, width:34, textAlign:'right' }}>{Math.round((r.total/data.total)*100)}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Por SDA */}
                <div>
                  <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Por resultado SDA</div>
                  {data.sda.map((r,i) => {
                    const max = data.sda[0]?.total || 1;
                    const pct = Math.round((r.total/max)*100);
                    const { color } = sdaColor(r.grupo);
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                        <div style={{ width:130, flexShrink:0 }}><Pill label={r.grupo} colorFn={sdaColor} /></div>
                        <div style={{ flex:1, background:'#0f1117', borderRadius:2, height:5, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2 }} />
                        </div>
                        <span style={{ fontSize:12, color:C.text1, fontWeight:600, width:24, textAlign:'right' }}>{r.total}</span>
                        <span style={{ fontSize:10, color:C.text3, width:34, textAlign:'right' }}>{Math.round((r.total/data.total)*100)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Historial */}
              <div>
                <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
                  Historial completo ({data.historial.length} registros)
                </div>
                <div style={{ border:`0.5px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>{['Fecha','Hora','Usuario','SDA','Estado','Campaña'].map(h=><th key={h} style={TH}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {data.historial.map((h,i) => (
                          <tr key={i}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <td style={{ ...TD, color:C.text1 }}>{h.fecha}</td>
                            <td style={{ ...TD, color:C.text2, fontVariantNumeric:'tabular-nums' }}>{h.hora}</td>
                            <td style={TD}>{h.usuario}</td>
                            <td style={TD}><Pill label={h.sda} colorFn={sdaColor} /></td>
                            <td style={TD}><Pill label={h.status_name} colorFn={estadoColor} /></td>
                            <td style={{ ...TD, fontSize:11, color:C.text3 }}>{h.campania}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:`0.5px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontSize:10, color:C.text3 }}>
            Presiona <kbd style={{ background:C.bg3, border:`0.5px solid ${C.b2}`, borderRadius:3, padding:'1px 5px', fontSize:10, color:C.text2 }}>Esc</kbd> para cerrar
          </span>
          <button onClick={onClose} style={{ background:C.blue, color:'#fff', border:'none', borderRadius:6, padding:'7px 20px', fontSize:12, fontFamily:FONT, cursor:'pointer' }}>Cerrar</button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
