import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { Order } from '../models';

@Injectable()
export class OrderRepository {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async findById(orderId: string): Promise<Order | null> {
    const query = `
      SELECT *
      FROM orders
      WHERE id = $1
    `;
    try {
      const result = await this.pool.query(query, [orderId]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error(
        `Error finding order by ID ${orderId}:`,
        error.message || error,
      );
      throw new Error('Could not retrieve order. Please try again later.');
    }
  }

  async createOrder(
    client: PoolClient,
    orderData: Partial<Order>,
  ): Promise<Order> {
    const { id, userId, cartId, total, delivery, comments, status, payment } =
      orderData;

    const query = `
      INSERT INTO orders (id, user_id, cart_id, total, delivery, comments, status, payment, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    try {
      const result = await client.query(query, [
        id,
        userId,
        cartId,
        total,
        JSON.stringify(delivery),
        comments,
        status,
        JSON.stringify(payment),
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating order:', error.message || error);
      throw new Error('Could not create order. Please try again later.');
    }
  }

  async updateOrder(orderId: string, data: Partial<Order>): Promise<void> {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
    const query = `
      UPDATE orders
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${index}
    `;
    values.push(orderId);

    try {
      const result = await this.pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error(`Order with ID ${orderId} not found for update.`);
      }
    } catch (error) {
      console.error(
        `Error updating order ID ${orderId}:`,
        error.message || error,
      );
      throw new Error('Could not update order. Please try again later.');
    }
  }
}
