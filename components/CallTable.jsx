'use client';
// components/CallTable.jsx

const C = { bg2:'#161b27', border:'rgba(255,255,255,0.08)', text1:'#e8eaf0', text2:'#8b93a8', text3:'#5a6278' };

const tipoMeta = {
  local:         { bg:'rgba(59,130,246,0.15)',  color:'#60a5fa',  label:'Local'   },
  larga_dist:    { bg:'rgba(245,158,11,0.12)',  color:'#fbbf24',  label:'L.Dist'  },
  celular:       { bg:'rgba(167,139,250,0.12)', color:'#c4b5fd',  label:'Celular' },
  voip:          { bg:'rgba(34,211,165,0.12)',  color:'#34d399',  label:'VoIP'    },
  internacional: { bg:'rgba(239,68,68,0.12)',   color:'#f87171',  label:'Intl'    },
};

function Pill({ tipo, estado }) {
  if (estado) {
    const ok = estado === 'ok';
    return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:3, fontWeight:600, background: ok?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', color: ok?'#4ade80':'#f87171' }}>{ok?'Completada':'Abandonada'}</span>;
  }
  const m = tipoMeta[tipo] || tipoMeta.local;
  return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:3, background:m.bg, color:m.color }}>{m.label}</span>;
}

const TH = { fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 14px', textAlign:'left', borderBottom:`0.5px solid ${C.border}`, fontWeight:500, whiteSpace:'nowrap' };
const TD = { padding:'9px 14px', color:C.text2, borderBottom:`0.5px solid ${C.border}`, fontVariantNumeric:'tabular-nums', fontSize:12 };

export default function CallTable({ llamadas, loading }) {
  const headers = ['Hora','Extensión','Destino','Tipo','Dir.','Duración','Costo','Estado','Campaña'];
  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, overflow:'hidden', marginBottom:'1rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:`0.5px solid ${C.border}` }}>
        <span style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase' }}>Registro de llamadas</span>
        <span style={{ fontSize:10, color:C.text3 }}>{llamadas.length} registros</span>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{headers.map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} style={{ ...TD, color:C.text3 }}>Cargando…</td></tr>
              : llamadas.slice(0,20).map((c,i) => (
                <tr key={i}>
                  <td style={TD}>{c.hora}</td>
                  <td style={{ ...TD, color:C.text1 }}>{c.extension}</td>
                  <td style={TD}>{c.destino}</td>
                  <td style={TD}><Pill tipo={c.tipo} /></td>
                  <td style={{ ...TD, fontSize:10, color: c.direccion==='INBOUND'?'#60a5fa':'#34d399' }}>{c.direccion}</td>
                  <td style={TD}>{c.duracion}</td>
                  <td style={{ ...TD, color:C.text1, fontWeight:600 }}>{c.costo}</td>
                  <td style={TD}><Pill estado={c.estado} /></td>
                  <td style={{ ...TD, color:C.text3, fontSize:11 }}>{c.campana}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
