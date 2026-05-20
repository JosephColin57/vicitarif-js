'use client';
// components/NavTabs.jsx — Navegación conservando fechas en URL
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const C = {
  bg3:    '#1e2535',
  border: 'rgba(255,255,255,0.08)',
  b2:     'rgba(255,255,255,0.14)',
  text2:  '#8b93a8',
  blue:   '#3b82f6',
};
const FONT = "'JetBrains Mono','Fira Code',monospace";

const TABS = [
  { href: '/dashboard', label: '📊 General', desc: 'Vicidial / Tarificación' },
  { href: '/azteca',    label: '📋 Azteca',  desc: 'Gestión de cartera'      },
];

export default function NavTabs() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Conserva los parámetros de fecha al navegar
  const buildHref = (base) => {
    const desde = searchParams.get('desde');
    const hasta  = searchParams.get('hasta');
    if (desde && hasta) return `${base}?desde=${desde}&hasta=${hasta}`;
    if (desde)           return `${base}?desde=${desde}`;
    return base;
  };

  return (
    <div style={{ display:'flex', gap:4, background:C.bg3, borderRadius:6, padding:'3px', border:`0.5px solid ${C.border}` }}>
      {TABS.map(tab => {
        const activo = pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={buildHref(tab.href)} style={{ textDecoration:'none' }}>
            <div style={{
              padding:'5px 14px', borderRadius:4,
              background: activo ? C.blue : 'transparent',
              color:       activo ? '#fff' : C.text2,
              fontSize:    11, fontFamily: FONT,
              cursor:'pointer', transition:'all .15s',
              whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6,
            }}>
              {tab.label}
              {activo && (
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.6)' }}>
                  {tab.desc}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
