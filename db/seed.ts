import { Pool } from 'pg';
import 'dotenv/config';

const sql = (strings: TemplateStringsArray, ...values: any[]): string =>
  strings.join('');

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

export async function insertTestData() {
  const client = await pool.connect();
  try {
    await client.query(sql`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);

    await client.query(sql`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL CHECK (status IN ('OPEN', 'ORDERED'))
      );
    `);

    await client.query(sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        cart_id UUID,
        product_id UUID NOT NULL,
        count INTEGER NOT NULL CHECK (count > 0),
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        PRIMARY KEY (cart_id, product_id)
      );
    `);

    await client.query(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        cart_id UUID NOT NULL REFERENCES carts(id),
        payment JSON NOT NULL,
        delivery JSON NOT NULL,
        comments TEXT,
        status TEXT NOT NULL CHECK (status IN ('OPEN', 'CANCELLED', 'COMPLETED', 'SENT', 'CONFIRMED', 'APPROVED')),
        total NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(sql`
      INSERT INTO carts (id, user_id, status, created_at, updated_at)
      VALUES
          ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'OPEN', NOW(), NOW()),
          ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'ORDERED', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(sql`
      INSERT INTO cart_items (cart_id, product_id, count)
      VALUES
          ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 2),
          ('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 1),
          ('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 3),
          ('33333333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', 4)
      ON CONFLICT DO NOTHING;
    `);

    await client.query(sql`
      INSERT INTO orders (id, user_id, cart_id, payment, delivery, comments, status, total, created_at, updated_at)
      VALUES
          (
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333',
            '{"method": "paypal", "account": "user@example.com"}',
            '{"address": "ul Boleslawa Chrobrego 79A/3", "firstName": "John", "lastName": "Smith"}',
            'Leave at front door',
            'OPEN',
            250.00,
            NOW(),
            NOW()
          )
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(sql`
      INSERT INTO users (name, email, password)
      VALUES
        ('John Doe', 'johndoe@example.com', 'password')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('Test data inserted successfully');
  } catch (err) {
    console.error('Error inserting test data:', err);
  } finally {
    client.release();
  }
}
