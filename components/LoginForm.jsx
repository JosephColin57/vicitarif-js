'use client';
// components/LoginForm.jsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const C = {
  bg2: '#161b27', bg3: '#1e2535',
  border: 'rgba(255,255,255,0.08)', b2: 'rgba(255,255,255,0.14)',
  text1: '#e8eaf0', text2: '#8b93a8', text3: '#5a6278',
  blue: '#3b82f6', teal: '#22d3a5',
};
const FONT = "'JetBrains Mono','Fira Code',monospace";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm]         = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: form.username.trim().toLowerCase(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return; }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', background: C.bg3, border: `0.5px solid ${C.b2}`,
    borderRadius: 6, color: C.text1, fontSize: 13,
    padding: '9px 36px 9px 34px', fontFamily: FONT, outline: 'none',
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .vt-inp:focus{border-color:${C.blue}!important}
        .vt-btn:hover:not(:disabled){opacity:.88}
      `}</style>

      <div style={{ background: C.bg2, border:`0.5px solid ${C.border}`, borderRadius:12, padding:'2.5rem 2rem', width:'100%', maxWidth:380, fontFamily: FONT }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', marginBottom:'2rem' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background: C.teal }} />
          <span style={{ fontSize:14, fontWeight:600, letterSpacing:'0.14em', color: C.text2, textTransform:'uppercase' }}>
            ViciTarif <span style={{ fontSize:11, color: C.text3 }}>v2.4</span>
          </span>
        </div>

        <h1 style={{ fontSize:20, fontWeight:700, color: C.text1, textAlign:'center', marginBottom:4 }}>Iniciar sesión</h1>
        <p  style={{ fontSize:12, color: C.text3, textAlign:'center', marginBottom:'1.75rem' }}>Acceso al sistema de tarificación</p>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'0.5px solid rgba(239,68,68,0.3)', borderRadius:4, padding:'8px 10px', fontSize:11, color:'#f87171', marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          <label style={{ display:'block', fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }} htmlFor="vt-user">
            Usuario
          </label>
          <div style={{ position:'relative', marginBottom:'1rem' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:16, color: C.text3, pointerEvents:'none' }}>👤</span>
            <input id="vt-user" type="text" className="vt-inp" style={inp}
              placeholder="admin" autoComplete="username"
              value={form.username} disabled={loading}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
          </div>

          <label style={{ display:'block', fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }} htmlFor="vt-pass">
            Contraseña
          </label>
          <div style={{ position:'relative', marginBottom:'1rem' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:16, color: C.text3, pointerEvents:'none' }}>🔒</span>
            <input id="vt-pass" type={showPass ? 'text' : 'password'} className="vt-inp" style={inp}
              placeholder="••••••••" autoComplete="current-password"
              value={form.password} disabled={loading}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color: C.text3, cursor:'pointer', fontSize:16, padding:0 }}>
              {showPass ? '🙈' : '👁'}
            </button>
          </div>

          <button type="submit" className="vt-btn" disabled={loading}
            style={{ width:'100%', background: loading ? C.text3 : C.blue, color:'#fff', border:'none', borderRadius:6, padding:'10px', fontSize:13, fontWeight:600, fontFamily: FONT, cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading
              ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} /> Verificando...</>
              : '→ Entrar al sistema'
            }
          </button>
        </form>

        <div style={{ marginTop:'1.5rem', textAlign:'center', fontSize:10, color: C.text3, borderTop:`0.5px solid ${C.border}`, paddingTop:'1rem' }}>
          Vicidial · MySQL · Next.js App Router
        </div>
      </div>
    </>
  );
}
