// lib/auth.js
import { SignJWT, jwtVerify } from 'jose';
import { cookies }            from 'next/headers';
import bcrypt                 from 'bcryptjs';

const JWT_SECRET  = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cambia_este_secreto_en_produccion'
);
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// Usuarios — en producción cargar desde BD
// Rol 'campana': solo ve las llamadas de su campaña asignada
export const USERS = [
  {
    id: 1, username: 'admin',
    password: '$2a$10$/yGOhjhJSN8dFolR9.RsE.kWiqRPt7wsnJsAtBDzqOpn2.ZHLFQk2', // TuPasswordAdmin
    role: 'admin', nombre: 'Administrador', campana: null,
  },
  {
    id: 2, username: 'supervisor',
    password: '$2a$10$fAq2iFFcDRbyZIb8bhbp6uMYftjfHFpoFWtEz0PKGee0vlYSCuf1y', // TuPasswordSuper
    role: 'supervisor', nombre: 'Supervisor TI', campana: null,
  },
  {
    id: 3, username: 'ventas',
    password: '$2a$10$LCEQiFshbCKOEn1.itf5TuP91EtolnNw5NjWPvOrr6sPJD.ly5PM6', // TuPasswordVentas
    role: 'campana', nombre: 'Supervisor Ventas', campana: 'VENTAS_OUT',
  },
  {
    id: 4, username: 'soporte',
    password: '$2a$10$HCRJwtDI24DTHgCUy6ZkFeXaBN7cnfLQ/6CRr4pQPnWvkI9aOtj4K', // TuPasswordSoporte
    role: 'campana', nombre: 'Supervisor Soporte', campana: 'SOPORTE_IN',
  },
  {
    id: 5, username: 'cobranza',
    password: '$2a$10$4VWamPtKGEuutZn1x/spa.CrD2WT/6ugKU7X67v211meeWtcieMI2', // TuPasswordCobranza
    role: 'campana', nombre: 'Supervisor Cobranza', campana: 'COBRANZA',
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
  } catch { return null; }
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
  name: 'vt_token', httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60,
};
