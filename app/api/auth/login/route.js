// app/api/auth/login/route.js
import { NextResponse }                        from 'next/server';
import { verifyCredentials, createToken, COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'username y password son requeridos' }, { status: 400 });
    }

    const user = await verifyCredentials(username, password);
    if (!user) {
      await new Promise(r => setTimeout(r, 300)); // anti-timing attack
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const token = await createToken({
      sub:      user.id,
      username: user.username,
      role:     user.role,
      nombre:   user.nombre,
    });

    const res = NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role, nombre: user.nombre },
    });

    res.cookies.set({ ...COOKIE_OPTIONS, value: token });
    return res;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
