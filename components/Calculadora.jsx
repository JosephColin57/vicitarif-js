'use client';
// components/Calculadora.jsx
import { useState } from 'react';

const C = { bg2:'#161b27', bg3:'#1e2535', border:'rgba(255,255,255,0.08)', b2:'rgba(255,255,255,0.14)', text1:'#e8eaf0', text2:'#8b93a8', text3:'#5a6278', blue:'#3b82f6', teal:'#22d3a5' };
const FONT = "'JetBrains Mono','Fira Code',monospace";

export default function Calculadora({ tarifas }) {
  const [tipo, setTipo]         = useState('local');
  const [duracion, setDuracion] = useState(5);
  const [horario, setHorario]   = useState('normal');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const calcular = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tarifas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ duracion_seg: duracion * 60, tipo, hora: horario === 'normal' ? 10 : 22 }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const sel = { width:'100%', background:C.bg3, border:`0.5px solid ${C.b2}`, borderRadius:4, color:C.text1, fontSize:12, padding:'7px 10px', fontFamily:FONT, outline:'none' };
  const lbl = { fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:5 };

  return (
    <div style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'14px 16px', marginBottom:'1rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end' }}>
        <div>
          <label style={lbl}>Tipo de llamada</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={sel}>
            <option value="local">Local</option>
            <option value="larga_dist">Larga distancia</option>
            <option value="celular">Celular</option>
            <option value="voip">VoIP / SIP</option>
            <option value="internacional">Internacional</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Duración (min)</label>
          <input type="number" min={0} step={0.5} value={duracion}
            onChange={e => setDuracion(parseFloat(e.target.value)||0)} style={sel} />
        </div>
        <div>
          <label style={lbl}>Horario</label>
          <select value={horario} onChange={e => setHorario(e.target.value)} style={sel}>
            <option value="normal">Hábil (08–20 h)</option>
            <option value="extra">Fuera de horario</option>
          </select>
        </div>
        <button onClick={calcular} disabled={loading}
          style={{ background:C.blue, color:'#fff', border:'none', borderRadius:4, padding:'7px 16px', fontSize:12, fontFamily:FONT, cursor: loading?'not-allowed':'pointer', whiteSpace:'nowrap' }}>
          {loading ? '…' : 'Calcular ▶'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop:12, background:C.bg3, border:`0.5px solid ${C.b2}`, borderRadius:6, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em' }}>Costo estimado</div>
            <div style={{ fontSize:12, color:C.text2, marginTop:3 }}>
              {result.duracion_min} min × ${result.tarifa?.toFixed(3)}/min
              {result.fuera_horario ? ` (+${Math.round((tarifas.fuera_horario||0.20)*100)}% fuera horario)` : ''}
            </div>
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:C.teal, fontVariantNumeric:'tabular-nums' }}>
            ${result.costo?.toFixed(4)}
          </div>
        </div>
      )}
    </div>
  );
}
