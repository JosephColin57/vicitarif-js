'use client';
// components/CallTable.jsx — con descarga CSV y Excel
import { useState } from 'react';

const C = {
  bg2:'#161b27', border:'rgba(255,255,255,0.08)',
  text1:'#e8eaf0', text2:'#8b93a8', text3:'#5a6278',
  blue:'#3b82f6', green:'#22c55e', teal:'#22d3a5',
};

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
    return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:3, fontWeight:600, background:ok?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', color:ok?'#4ade80':'#f87171' }}>{ok?'Completada':'Abandonada'}</span>;
  }
  const m = tipoMeta[tipo] || tipoMeta.local;
  return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:3, background:m.bg, color:m.color }}>{m.label}</span>;
}

// ── Descarga CSV ──────────────────────────────────────────────
function descargarCSV(llamadas, fecha, campana) {
  const headers = ['Hora','Extension','Destino','Tipo','Direccion','Duracion','Costo','Estado','Campana'];
  const rows = llamadas.map(l => [
    l.hora, l.extension, l.destino, l.tipo,
    l.direccion, l.duracion, l.costo, l.estado, l.campana
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `llamadas_${campana || 'todas'}__${desde}_${hasta}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Descarga Excel (XLSX manual con XML) ─────────────────────
function descargarExcel(llamadas, fecha, campana) {
  const headers = ['Hora','Extensión','Destino','Tipo','Dirección','Duración','Costo','Estado','Campaña'];
  const filas = llamadas.map(l => [
    l.hora, l.extension, l.destino, l.tipo,
    l.direccion, l.duracion, l.costo, l.estado, l.campana
  ]);

  const esc = v => String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Llamadas">
    <Table>
      <Row>${headers.map(h => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>
      ${filas.map(f => `<Row>${f.map(v => `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`).join('')}</Row>`).join('\n')}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type:'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `llamadas_${campana || 'todas'}__${desde}_${hasta}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

const TH = {
  fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em',
  padding:'8px 14px', textAlign:'left', borderBottom:`0.5px solid ${C.border}`,
  fontWeight:500, whiteSpace:'nowrap',
};
const TD = {
  padding:'9px 14px', color:C.text2, borderBottom:`0.5px solid ${C.border}`,
  fontVariantNumeric:'tabular-nums', fontSize:12,
};

export default function CallTable({ llamadas, loading, desde, hasta, campana }) {
  const [pagina, setPagina]   = useState(1);
  const [filtro, setFiltro]   = useState('');
  const POR_PAGINA = 20;

  const filtradas = llamadas.filter(l =>
    !filtro ||
    l.extension?.includes(filtro) ||
    l.destino?.includes(filtro) ||
    l.campana?.toLowerCase().includes(filtro.toLowerCase()) ||
    l.tipo?.includes(filtro)
  );

  const totalPags = Math.ceil(filtradas.length / POR_PAGINA);
  const paginadas = filtradas.slice((pagina-1)*POR_PAGINA, pagina*POR_PAGINA);

  const headers = ['Hora','Extensión','Destino','Tipo','Dir.','Duración','Costo','Estado','Campaña'];

  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, overflow:'hidden', marginBottom:'1rem' }}>

      {/* Header con filtro y botones de descarga */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:`0.5px solid ${C.border}`, gap:10, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, letterSpacing:'0.1em', color:C.text2, textTransform:'uppercase' }}>
            Registro de llamadas
          </span>
          <span style={{ fontSize:10, color:C.text3 }}>{filtradas.length} registros</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Filtro rápido */}
          <input
            type="text"
            placeholder="Buscar extensión, destino..."
            value={filtro}
            onChange={e => { setFiltro(e.target.value); setPagina(1); }}
            style={{
              background:'#1e2535', border:`0.5px solid rgba(255,255,255,0.14)`,
              borderRadius:4, color:C.text1, fontSize:11, padding:'5px 10px',
              fontFamily:'inherit', outline:'none', width:200,
            }}
          />

          {/* Botón CSV */}
          <button
            onClick={() => descargarCSV(filtradas, fecha, campana)}
            disabled={loading || filtradas.length === 0}
            style={{
              background:'rgba(34,211,165,0.1)', border:'0.5px solid rgba(34,211,165,0.3)',
              borderRadius:4, color:'#22d3a5', fontSize:11, padding:'5px 12px',
              cursor: filtradas.length===0 ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:5,
              opacity: filtradas.length===0 ? 0.4 : 1,
            }}
          >
            ↓ CSV
          </button>

          {/* Botón Excel */}
          <button
            onClick={() => descargarExcel(filtradas, fecha, campana)}
            disabled={loading || filtradas.length === 0}
            style={{
              background:'rgba(59,130,246,0.1)', border:'0.5px solid rgba(59,130,246,0.3)',
              borderRadius:4, color:'#60a5fa', fontSize:11, padding:'5px 12px',
              cursor: filtradas.length===0 ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:5,
              opacity: filtradas.length===0 ? 0.4 : 1,
            }}
          >
            ↓ Excel
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{headers.map(h => <th key={h} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} style={{ ...TD, color:C.text3, padding:'20px 16px' }}>Cargando…</td></tr>
              : paginadas.length === 0
                ? <tr><td colSpan={9} style={{ ...TD, color:C.text3, padding:'20px 16px' }}>Sin registros para esta fecha</td></tr>
                : paginadas.map((c,i) => (
                  <tr key={i} style={{ transition:'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={TD}>{c.hora}</td>
                    <td style={{ ...TD, color:C.text1 }}>{c.extension}</td>
                    <td style={TD}>{c.destino}</td>
                    <td style={TD}><Pill tipo={c.tipo} /></td>
                    <td style={{ ...TD, fontSize:10, color:c.direccion==='INBOUND'?'#60a5fa':'#34d399' }}>{c.direccion}</td>
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

      {/* Paginación */}
      {totalPags > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:`0.5px solid ${C.border}` }}>
          <span style={{ fontSize:11, color:C.text3 }}>
            Página {pagina} de {totalPags} — {filtradas.length} registros
          </span>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setPagina(p => Math.max(1,p-1))} disabled={pagina===1}
              style={{ background:'transparent', border:`0.5px solid ${C.border}`, borderRadius:4, color:pagina===1?C.text3:C.text2, fontSize:11, padding:'4px 10px', cursor:pagina===1?'not-allowed':'pointer', fontFamily:'inherit' }}>
              ← Anterior
            </button>
            <button onClick={() => setPagina(p => Math.min(totalPags,p+1))} disabled={pagina===totalPags}
              style={{ background:'transparent', border:`0.5px solid ${C.border}`, borderRadius:4, color:pagina===totalPags?C.text3:C.text2, fontSize:11, padding:'4px 10px', cursor:pagina===totalPags?'not-allowed':'pointer', fontFamily:'inherit' }}>
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
