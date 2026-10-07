import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: pkg.Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = 
      process.env.DATABASE_URL || 
      process.env.DATABASE_PUBLIC_URL || 
      process.env.DATABASE_PRIVATE_URL || 
      process.env.POSTGRES_URL || 
      process.env.POSTGRESQL_URL;
    
    // Determine if SSL is required (e.g. Neon, Supabase, Render, cloud hosts or non-localhost)
    const host = process.env.SQL_HOST || process.env.PGHOST || '';
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === 'postgres' || host === '';
    
    // Check if SSL should be disabled (e.g. Railway private internal network)
    const sslExplicitlyDisabled = 
      process.env.PGSSLMODE === 'disable' || 
      process.env.SQL_SSL === 'false' ||
      Boolean(connectionString && (connectionString.includes('sslmode=disable') || connectionString.includes('railway.internal')));

    const useSsl = !sslExplicitlyDisabled && Boolean(
      process.env.PGSSLMODE === 'require' ||
      (connectionString && (
        connectionString.includes('sslmode=require') || 
        connectionString.includes('neon.tech') || 
        connectionString.includes('supabase.co') || 
        connectionString.includes('render.com') ||
        connectionString.includes('proxy.rlwy.net')
      )) ||
      (!isLocalhost && (host.includes('.') || process.env.SQL_SSL === 'true'))
    );

    if (connectionString) {
      global._postgresPool = new Pool({
        connectionString,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 3500,
        idleTimeoutMillis: 30000,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || process.env.PGHOST || 'localhost',
        port: Number(process.env.SQL_PORT || process.env.PGPORT || 5432),
        user: process.env.SQL_USER || process.env.PGUSER || 'postgres',
        password: process.env.SQL_PASSWORD || process.env.PGPASSWORD || 'postgres',
        database: process.env.SQL_DB_NAME || process.env.PGDATABASE || 'exerfit_db',
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 3500,
        idleTimeoutMillis: 30000,
      });
    }

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('Postgres connection pool notice (resilient mode active):', err?.message || err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export { schema };

