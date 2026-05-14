// middleware.js — raíz del proyecto
import { NextResponse } from 'next/server';
import { jwtVerify }    from 'jose';

const JWT_SECRET  = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cambia_este_secreto_en_produccion'
);

const PUBLIC_PATHS = ['/', '/api/auth/login'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get('vt_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.delete('vt_token');
    return res;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth/login).)*'],
};
