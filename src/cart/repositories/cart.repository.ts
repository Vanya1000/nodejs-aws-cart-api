import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../models';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class CartRepository {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async createCartByUserId(userId: string): Promise<Cart> {
    const query = `
      INSERT INTO carts (user_id, status, created_at, updated_at)
      VALUES ($1, 'OPEN', NOW(), NOW())
      RETURNING id AS cart_id, user_id, status, created_at, updated_at
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return {
        id: result.rows[0].cart_id,
        user_id: result.rows[0].user_id,
        status: result.rows[0].status,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
        items: [],
      };
    } catch (error) {
      console.error(
        `Error creating cart for user ID ${userId}:`,
        error.message || error,
      );
      throw new Error('Could not create cart. Please try again later.');
    }
  }

  async findCartByUserId(userId: string): Promise<Cart | null> {
    const query = `
    SELECT
      carts.id AS cart_id,
      carts.user_id,
      carts.created_at,
      carts.updated_at,
      carts.status,
      COALESCE(
        json_agg(
          json_build_object(
            'productId', cart_items.product_id,
            'count', cart_items.count
          )
        ) FILTER (WHERE cart_items.product_id IS NOT NULL),
        '[]'
      ) AS items
    FROM
      carts
    LEFT JOIN
      cart_items ON carts.id = cart_items.cart_id
    WHERE
      carts.user_id = $1
      AND carts.status = 'OPEN'
    GROUP BY
      carts.id, carts.user_id, carts.created_at, carts.updated_at, carts.status
    LIMIT 1
  `;

    try {
      const result = await this.pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      return {
        id: row.cart_id,
        user_id: row.user_id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        items: row.items,
      };
    } catch (error) {
      console.error(
        `Error finding cart for user ID ${userId}:`,
        error.message || error,
      );
      throw new Error('Could not retrieve cart. Please try again later.');
    }
  }

  async addCartItem(
    cartId: string,
    productId: string,
    count: number,
  ): Promise<void> {
    const query = `
      INSERT INTO cart_items (cart_id, product_id, count)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id) DO UPDATE
      SET count = cart_items.count + $3
    `;

    try {
      await this.pool.query(query, [cartId, productId, count]);
    } catch (error) {
      console.error(
        `Error adding item to cart. Cart ID: ${cartId}, Product ID: ${productId}, Count: ${count}`,
        error,
      );
      throw new Error('Could not add item to cart. Please try again later.');
    }
  }

  async updateCartItemCount(
    cartId: string,
    productId: string,
    count: number,
  ): Promise<void> {
    const query = `
      UPDATE cart_items
      SET count = $3
      WHERE cart_id = $1 AND product_id = $2
    `;

    try {
      const result = await this.pool.query(query, [cartId, productId, count]);

      if (result.rowCount === 0) {
        throw new Error(
          `No cart item found to update. Cart ID: ${cartId}, Product ID: ${productId}`,
        );
      }
    } catch (error) {
      console.error(
        `Error updating cart item count. Cart ID: ${cartId}, Product ID: ${productId}, Count: ${count}`,
        error,
      );
      throw new Error(
        'Could not update cart item count. Please try again later.',
      );
    }
  }

  async removeCartItem(cartId: string, productId: string): Promise<void> {
    const query = `
      DELETE FROM cart_items
      WHERE cart_id = $1 AND product_id = $2
    `;

    try {
      const result = await this.pool.query(query, [cartId, productId]);

      if (result.rowCount === 0) {
        throw new Error(
          `No cart item found to delete. Cart ID: ${cartId}, Product ID: ${productId}`,
        );
      }
    } catch (error) {
      console.error(
        `Error removing cart item. Cart ID: ${cartId}, Product ID: ${productId}`,
        error,
      );
      throw new Error('Could not remove cart item. Please try again later.');
    }
  }

  async deleteCartById(cartId: string): Promise<void> {
    const query = `
      DELETE FROM carts
      WHERE id = $1
    `;

    try {
      const result = await this.pool.query(query, [cartId]);

      if (result.rowCount === 0) {
        throw new Error(`Cart with ID ${cartId} not found for deletion.`);
      }
    } catch (error) {
      console.error(
        `Error deleting cart with ID ${cartId}:`,
        error.message || error,
      );
      throw new Error('Could not delete cart. Please try again later.');
    }
  }

  async updateCartStatus(
    client: PoolClient,
    cartId: string,
    status: string,
  ): Promise<void> {
    const query = `
      UPDATE carts
      SET status = $2, updated_at = NOW()
      WHERE id = $1
    `;
    try {
      const result = await client.query(query, [cartId, status]);
      if (result.rowCount === 0) {
        throw new Error(`Cart with ID ${cartId} not found for status update.`);
      }
    } catch (error) {
      console.error(
        `Error updating cart status. Cart ID: ${cartId}, Status: ${status}`,
        error.message || error,
      );
      throw new Error('Could not update cart status. Please try again later.');
    }
  }
}
