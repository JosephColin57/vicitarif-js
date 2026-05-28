// lib/auth.js
import { SignJWT, jwtVerify } from 'jose';
import { cookies }            from 'next/headers';
import bcrypt                 from 'bcryptjs';
import { Database }           from '@/lib/db';

export class AuthService {
  static #secret  = new TextEncoder().encode(
    process.env.JWT_SECRET || 'cambia_este_secreto_en_produccion'
  );
  static #expires = process.env.JWT_EXPIRES || '8h';

  static get cookieOptions() {
    return {
      name: 'vt_token', httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60,
    };
  }

  static async createToken(payload) {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.#expires)
      .sign(this.#secret);
  }

  static async verifyToken(token) {
    try {
      const { payload } = await jwtVerify(token, this.#secret);
      return payload;
    } catch { return null; }
  }

  static async verifyCredentials(username, password) {
    const { rows } = await Database.query(
      `SELECT id, username, password, role, nombre, campana
       FROM usuarios
       WHERE username = $1 AND activo = TRUE`,
      [username.toLowerCase().trim()]
    );
    if (!rows.length) return null;
    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    const { password: _, ...safe } = user;
    return safe;
  }

  static async getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('vt_token')?.value;
    if (!token) return null;
    return this.verifyToken(token);
  }

  /**
   * Devuelve el valor de "campana" que debe forzarse en los queries
   * según el rol del usuario (columna campana de azteca_registros).
   *  - role = 'campana'            → su campana del JWT (sin excepciones)
   *  - role = 'admin'/'supervisor' → null (ven todo; el filtro viene del URL)
   */
  static getCampanaFiltro(session) {
    if (session?.role === 'campana') return session.campana ?? null;
    return null;
  }
}
