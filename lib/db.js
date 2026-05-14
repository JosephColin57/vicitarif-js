// lib/db.js — PostgreSQL con pg
import { Pool } from 'pg';

function createPool() {
  return new Pool({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    user:     process.env.DB_USER,
    password: process.env.DB_PASS || undefined,
    database: process.env.DB_NAME || 'vicitarif',
    max:      10,
    idleTimeoutMillis:       30000,
    connectionTimeoutMillis: 5000,
  });
}

const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalThis._pgPool = pool;

export default pool;