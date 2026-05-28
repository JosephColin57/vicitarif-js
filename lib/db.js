// lib/db.js — PostgreSQL con pg (Singleton)
import { Pool } from 'pg';

export class Database {
  static #instance = null;

  static getInstance() {
    if (!this.#instance) {
      this.#instance = globalThis._pgPool ?? new Pool({
        host:     process.env.DB_HOST || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432'),
        user:     process.env.DB_USER,
        password: process.env.DB_PASS || undefined,
        database: process.env.DB_NAME || 'vicitarif',
        max:      10,
        idleTimeoutMillis:       30000,
        connectionTimeoutMillis: 5000,
      });
      if (process.env.NODE_ENV !== 'production') globalThis._pgPool = this.#instance;
    }
    return this.#instance;
  }

  static async query(sql, params) {
    return this.getInstance().query(sql, params);
  }
}

export default Database;
