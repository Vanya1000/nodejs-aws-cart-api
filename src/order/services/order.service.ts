import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OrderRepository } from '../repositories/order.repository';
import { CartRepository } from '../../cart/repositories/cart.repository';
import { Order, OrderStatus } from 'src/order/models';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
  ) {}

  async findById(orderId: string): Promise<Order> {
    try {
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        throw new BadRequestException('Order not found');
      }
      return order;
    } catch (error) {
      console.error(
        `Error finding order by ID ${orderId}:`,
        error.message || error,
      );
      throw new BadRequestException(
        'Could not retrieve order. Please try again later.',
      );
    }
  }

  async create(data: any): Promise<Order> {
    const client = await this.orderRepository.getClient();
    try {
      await client.query('BEGIN');

      const orderId = uuidv4();
      const { userId, cartId, total, delivery, comments, payment } = data;

      const order = await this.orderRepository.createOrder(client, {
        id: orderId,
        userId,
        cartId,
        total,
        delivery,
        comments,
        status: OrderStatus.Open,
        payment,
      });

      await this.cartRepository.updateCartStatus(client, cartId, 'ORDERED');

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order and updating cart status:', error);
      throw new BadRequestException(
        'Could not create order. Please try again later.',
      );
    } finally {
      client.release();
    }
  }

  async update(orderId: string, data: any): Promise<void> {
    try {
      const existingOrder = await this.orderRepository.findById(orderId);
      if (!existingOrder) {
        throw new BadRequestException('Order does not exist.');
      }
      await this.orderRepository.updateOrder(orderId, data);
    } catch (error) {
      console.error(
        `Error updating order ID ${orderId}:`,
        error.message || error,
      );
      throw new BadRequestException(
        'Could not update order. Please try again later.',
      );
    }
  }
}
