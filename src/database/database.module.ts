import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false,
  },
});

@Global()
@Module({
  providers: [
    {
      provide: 'PG_POOL',
      useValue: pool,
    },
  ],
  exports: ['PG_POOL'],
})
export class DatabaseModule {}
