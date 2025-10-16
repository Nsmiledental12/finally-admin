import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('❌ Missing required database environment variables!');
  console.error('Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
  process.exit(1);
}

const sslConfig = process.env.DB_SSL === 'false' ? false : {
  rejectUnauthorized: false
};

const pool = new Pool({
  host: process.env.DB_HOST || 'database-1.cnwu8u0y2mg3.ap-south-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dental_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Nsmiledental',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false     // ← Add SSL (AWS requires it)
  }
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
