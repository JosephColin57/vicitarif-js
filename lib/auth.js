// lib/auth.js
import { SignJWT, jwtVerify } from 'jose';
import { cookies }           from 'next/headers';
import bcrypt                from 'bcryptjs';

const JWT_SECRET  = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cambia_este_secreto_en_produccion'
);
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// Usuarios — en producción cárgalos desde la BD
// Para regenerar: bcrypt.hashSync('password', 10)
export const USERS = [
  {
    id:       1,
    username: 'admin',
    password: '$2a$10$icdmFZVNthQm6KsJcZHctefdfvyov7bE0ZdfNvjqynC.GKoQArDle', // admin123
    role:     'admin',
    nombre:   'Administrador',
  },
  {
    id:       2,
    username: 'supervisor',
    password: '$2a$10$6YL3Ae1NMPfq7B7OhBa5ZOjGm2lQhHj6GdXqg5yZO2tW5VVZZ5q5.', // super456
    role:     'supervisor',
    nombre:   'Supervisor TI',
  },
];

export async function createToken(payload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function verifyCredentials(username, password) {
  const user = USERS.find(u => u.username === username.toLowerCase().trim());
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  const { password: _, ...safe } = user;
  return safe;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('vt_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const COOKIE_OPTIONS = {
  name:     'vt_token',
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path:     '/',
  maxAge:   8 * 60 * 60,
};
