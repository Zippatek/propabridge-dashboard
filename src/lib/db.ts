import 'server-only'
import { Pool } from 'pg'

/**
 * Singleton connection pool to the Propabridge Cloud SQL (PostgreSQL).
 * Used ONLY server-side (auth callbacks, API routes).
 * Connection credentials come from .env.local / Cloud Run env vars.
 */

let pool: Pool | null = null

function getPool(): Pool {
  if (pool) return pool
  pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })
  return pool
}

export { getPool }
