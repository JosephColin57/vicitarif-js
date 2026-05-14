'use client';
// components/TarifasPanel.jsx
import { useState } from 'react';

const C = { bg2:'#161b27', bg3:'#1e2535', border:'rgba(255,255,255,0.08)', b2:'rgba(255,255,255,0.14)', text1:'#e8eaf0', text3:'#5a6278', blue:'#3b82f6', green:'#22c55e' };
const FONT = "'JetBrains Mono','Fira Code',monospace";

const FIELDS = [
  { key:'local',         label:'Local',           unit:'$/min'        },
  { key:'larga_dist',    label:'Larga distancia',  unit:'$/min'        },
  { key:'celular',       label:'Celular',           unit:'$/min'        },
  { key:'voip',          label:'VoIP / SIP',        unit:'$/min'        },
  { key:'internacional', label:'Internacional',     unit:'$/min'        },
  { key:'fuera_horario', label:'Fuera de horario',  unit:'multiplicador'},
];

export default function TarifasPanel({ tarifas, onSave, isAdmin }) {
  const [local, setLocal]   = useState({ ...tarifas });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(local);
    setSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const inp = { width:'100%', background:C.bg3, border:`0.5px solid ${C.b2}`, borderRadius:4, color:C.text1, fontSize:12, padding:'5px 8px', fontFamily:FONT, outline:'none' };

  return (
    <div style={{ marginBottom:'1rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:10 }}>
        {FIELDS.map(({ key, label, unit }) => (
          <div key={key} style={{ background:C.bg2, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:18, fontWeight:700, color:C.text1, fontVariantNumeric:'tabular-nums', marginBottom:2 }}>
              {key==='fuera_horario' ? `+${Math.round(local[key]*100)}%` : `$${local[key].toFixed(3)}`}
            </div>
            <div style={{ fontSize:11, color:C.text3, marginBottom:8 }}>{unit}</div>
            <input type="number" value={local[key]} step={key==='fuera_horario'?0.01:0.001} min={0}
              disabled={!isAdmin}
              onChange={e => setLocal(p => ({ ...p, [key]: parseFloat(e.target.value)||0 }))}
              style={{ ...inp, opacity: isAdmin?1:0.5 }} />
          </div>
        ))}
      </div>
      {isAdmin
        ? <button onClick={handleSave} disabled={saving}
            style={{ background: saved?C.green:C.blue, color:'#fff', border:'none', borderRadius:4, padding:'8px 20px', fontSize:12, fontFamily:FONT, cursor: saving?'not-allowed':'pointer' }}>
            {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar tarifas'}
          </button>
        : <p style={{ fontSize:11, color:C.text3 }}>Solo administradores pueden editar tarifas.</p>
      }
    </div>
  );
}
