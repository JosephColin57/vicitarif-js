'use client';
// components/AztecaTabla.jsx

import { useState } from 'react';

const C = {
  bg2:'#161b27', border:'rgba(255,255,255,0.08)',
  text1:'#e8eaf0', text2:'#8b93a8', text3:'#5a6278',
  blue:'#3b82f6', teal:'#22d3a5',
};

// Colores por tipo de resultado
function estadoStyle(status) {
  if (!status) return { bg:'rgba(255,255,255,0.05)', color:'#8b93a8' };
  const s = status.toLowerCase();
  if (s.includes('promesa'))                          return { bg:'rgba(34,197,94,0.12)',   color:'#4ade80' };
  if (s.includes('pago') && !s.includes('promesa'))  return { bg:'rgba(245,158,11,0.12)',  color:'#fbbf24' };
  if (s.includes('inbound') || s.includes('picked')) return { bg:'rgba(59,130,246,0.12)',  color:'#60a5fa' };
  if (s.includes('negativa') || s.includes('drop'))  return { bg:'rgba(239,68,68,0.12)',   color:'#f87171' };
  if (s.includes('answering') || s.includes('buzon'))return { bg:'rgba(100,116,139,0.15)', color:'#94a3b8' };
  if (s.includes('contacto') || s.includes('habla')) return { bg:'rgba(167,139,250,0.12)', color:'#c4b5fd' };
  return { bg:'rgba(255,255,255,0.05)', color:'#8b93a8' };
}

function sdaStyle(sda) {
  if (!sda || sda === '—') return { bg:'rgba(255,255,255,0.05)', color:'#5a6278' };
  const s = sda.toLowerCase();
  if (s.includes('answered'))  return { bg:'rgba(34,211,165,0.12)',  color:'#22d3a5' };
  if (s.includes('no answer')) return { bg:'rgba(245,158,11,0.12)',  color:'#fbbf24' };
  if (s.includes('failed'))    return { bg:'rgba(239,68,68,0.12)',   color:'#f87171' };
  if (s.includes('busy'))      return { bg:'rgba(239,68,68,0.08)',   color:'#fca5a5' };
  return { bg:'rgba(255,255,255,0.05)', color:'#8b93a8' };
}

function Pill({ label, styleFn }) {
  const { bg, color } = styleFn(label);
  return (
    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:3, background:bg, color, whiteSpace:'nowrap', display:'inline-block', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}
      title={label}>
      {label || '—'}
    </span>
  );
}

function descargarCSV(datos, desde, hasta, campana) {
  const headers = ['Fecha','Usuario','Teléfono','SDA','Estado','Campaña'];
  const rows    = datos.map(r => [r.fecha, r.usuario, r.phone, r.sda, r.status_name, r.campania]);
  const csv     = [headers,...rows].map(r => r.map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob    = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `azteca_${campana||'todas'}__${desde}_${hasta}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function descargarExcel(datos, desde, hasta, campana) {
  const headers = ['Fecha','Usuario','Teléfono','SDA','Estado','Campaña'];
  const filas   = datos.map(r => [r.fecha, r.usuario, r.phone, r.sda, r.status_name, r.campania]);
  const esc     = v => String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const xml     = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Azteca"><Table>
    <Row>${headers.map(h=>`<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>
    ${filas.map(f=>`<Row>${f.map(v=>`<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`).join('')}</Row>`).join('\n')}
  </Table></Worksheet>
</Workbook>`;
  const blob = new Blob([xml], { type:'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `azteca_${campana||'todas'}__${desde}_${hasta}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

const TH = { fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 14px', textAlign:'left', borderBottom:`0.5px solid ${C.border}`, fontWeight:500, whiteSpace:'nowrap' };
const TD = { padding:'9px 14px', color:C.text2, borderBottom:`0.5px solid ${C.border}`, fontSize:12 };

export default function AztecaTabla({ llamadas, loading, desde, hasta, campana, onVerRecurrencia }) {
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const POR_PAGINA = 20;

  const estadosUnicos = [...new Set(llamadas.map(l => l.status_name))].sort();

  const filtradas = llamadas.filter(l => {
    const matchTexto = !filtro ||
      l.phone?.includes(filtro) ||
      l.usuario?.toLowerCase().includes(filtro.toLowerCase()) ||
      l.campania?.toLowerCase().includes(filtro.toLowerCase());
    const matchEstado = !filtroEstado || l.status_name === filtroEstado;
    return matchTexto && matchEstado;
  });

  const totalPags = Math.ceil(filtradas.length / POR_PAGINA);
  const paginadas = filtradas.slice((pagina-1)*POR_PAGINA, pagina*POR_PAGINA);
  const headers   = ['Fecha','Usuario','Teléfono','SDA','Estado','Campaña'];

  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, overflow:'hidden', marginBottom:'1rem' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:`0.5px solid ${C.border}`, gap:10, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase' }}>Gestión Azteca</span>
          <span style={{ fontSize:10, color:C.text3 }}>{filtradas.length} registros</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <input type="text" placeholder="Teléfono, usuario, campaña..."
            value={filtro} onChange={e => { setFiltro(e.target.value); setPagina(1); }}
            style={{ background:'#1e2535', border:`0.5px solid rgba(255,255,255,0.14)`, borderRadius:4, color:C.text1, fontSize:11, padding:'5px 10px', fontFamily:'inherit', outline:'none', width:200 }} />
          <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }}
            style={{ background:'#1e2535', border:`0.5px solid rgba(255,255,255,0.14)`, borderRadius:4, color:C.text1, fontSize:11, padding:'5px 8px', fontFamily:'inherit', outline:'none', maxWidth:180 }}>
            <option value="">Todos los estados</option>
            {estadosUnicos.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button onClick={() => descargarCSV(filtradas, desde, hasta, campana)} disabled={loading||filtradas.length===0}
            style={{ background:'rgba(34,211,165,0.1)', border:'0.5px solid rgba(34,211,165,0.3)', borderRadius:4, color:'#22d3a5', fontSize:11, padding:'5px 12px', cursor:'pointer', fontFamily:'inherit', opacity:filtradas.length===0?0.4:1 }}>
            ↓ CSV
          </button>
          <button onClick={() => descargarExcel(filtradas, desde, hasta, campana)} disabled={loading||filtradas.length===0}
            style={{ background:'rgba(59,130,246,0.1)', border:'0.5px solid rgba(59,130,246,0.3)', borderRadius:4, color:'#60a5fa', fontSize:11, padding:'5px 12px', cursor:'pointer', fontFamily:'inherit', opacity:filtradas.length===0?0.4:1 }}>
            ↓ Excel
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{headers.map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} style={{ ...TD, color:C.text3, padding:'20px 16px' }}>Cargando…</td></tr>
              : paginadas.length === 0
                ? <tr><td colSpan={6} style={{ ...TD, color:C.text3, padding:'20px 16px' }}>Sin registros</td></tr>
                : paginadas.map((r,i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={TD}>{r.fecha}</td>
                    <td style={{ ...TD, color:C.text1 }}>{r.usuario}</td>

                    {/* Teléfono clickeable */}
                    <td style={TD}>
                      {r.phone && !r.phone.startsWith('V') ? (
                        <button onClick={() => onVerRecurrencia(r.phone)}
                          style={{ background:'transparent', border:'none', padding:0, color:C.blue, fontSize:12, cursor:'pointer', fontFamily:'inherit', textDecoration:'underline', textDecorationStyle:'dotted', textUnderlineOffset:3, fontVariantNumeric:'tabular-nums' }}
                          onMouseEnter={e => e.target.style.color='#93c5fd'}
                          onMouseLeave={e => e.target.style.color=C.blue}
                          title={`Ver recurrencia de ${r.phone}`}>
                          {r.phone}
                        </button>
                      ) : (
                        <span style={{ fontSize:11, color:C.text3 }}>{r.phone}</span>
                      )}
                    </td>

                    <td style={TD}><Pill label={r.sda} styleFn={sdaStyle} /></td>
                    <td style={TD}><Pill label={r.status_name} styleFn={estadoStyle} /></td>
                    <td style={{ ...TD, fontSize:11, color:C.text3 }}>{r.campania}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPags > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:`0.5px solid ${C.border}` }}>
          <span style={{ fontSize:11, color:C.text3 }}>Página {pagina} de {totalPags}</span>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setPagina(p=>Math.max(1,p-1))} disabled={pagina===1}
              style={{ background:'transparent', border:`0.5px solid ${C.border}`, borderRadius:4, color:pagina===1?C.text3:C.text2, fontSize:11, padding:'4px 10px', cursor:pagina===1?'not-allowed':'pointer', fontFamily:'inherit' }}>← Anterior</button>
            <button onClick={() => setPagina(p=>Math.min(totalPags,p+1))} disabled={pagina===totalPags}
              style={{ background:'transparent', border:`0.5px solid ${C.border}`, borderRadius:4, color:pagina===totalPags?C.text3:C.text2, fontSize:11, padding:'4px 10px', cursor:pagina===totalPags?'not-allowed':'pointer', fontFamily:'inherit' }}>Siguiente →</button>
          </div>
        </div>
      )}
    </div>
  );
}
