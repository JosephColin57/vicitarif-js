// app/api/auth/login/route.js
import { NextResponse }  from 'next/server';
import { AuthService }   from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'username y password son requeridos' }, { status: 400 });
    }

    const user = await AuthService.verifyCredentials(username, password);
    if (!user) {
      await new Promise(r => setTimeout(r, 300)); // anti-timing attack
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // campana se incluye en el token para que los routes puedan
    // hacer enforcement sin consultar la BD en cada petición
    const token = await AuthService.createToken({
      sub:      user.id,
      username: user.username,
      role:     user.role,
      nombre:   user.nombre,
      campana:  user.campana,   // ← valor de campania que puede ver este usuario
    });

    const res = NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role, nombre: user.nombre, campana: user.campana },
    });

    res.cookies.set({ ...AuthService.cookieOptions, value: token });
    return res;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
