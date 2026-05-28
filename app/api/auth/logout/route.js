// app/api/auth/logout/route.js
import { NextResponse }  from 'next/server';
import { AuthService }   from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...AuthService.cookieOptions, value: '', maxAge: 0 });
  return res;
}
