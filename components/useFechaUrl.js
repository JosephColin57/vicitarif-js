'use client';
// components/useFechaUrl.js
// Hook que sincroniza las fechas con la URL (?desde=&hasta=)
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function useFechaUrl() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const hoy          = new Date().toISOString().slice(0,10);

  // Lee desde la URL o usa hoy por defecto
  const [desde, setDesdeState] = useState(searchParams.get('desde') || hoy);
  const [hasta,  setHastaState]  = useState(searchParams.get('hasta')  || hoy);
  const [rangoActivo, setRangoActivo] = useState('');

  // Sincroniza URL cuando cambian las fechas
  const setDesde = useCallback((val) => {
    setDesdeState(val);
    const params = new URLSearchParams(searchParams.toString());
    params.set('desde', val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const setHasta = useCallback((val) => {
    setHastaState(val);
    const params = new URLSearchParams(searchParams.toString());
    params.set('hasta', val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const setRango = useCallback((desde, hasta, label) => {
    setDesdeState(desde);
    setHastaState(hasta);
    setRangoActivo(label);
    const params = new URLSearchParams(searchParams.toString());
    params.set('desde', desde);
    params.set('hasta',  hasta);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Sincroniza si la URL cambia externamente (ej. al navegar desde NavTabs)
  useEffect(() => {
    const d = searchParams.get('desde');
    const h = searchParams.get('hasta');
    if (d) setDesdeState(d);
    if (h) setHastaState(h);
  }, [searchParams]);

  return { desde, hasta, rangoActivo, setDesde, setHasta, setRango, setRangoActivo, hoy };
}
