import { Module } from '@nestjs/common';
import { OrderService } from './services';
import { OrderRepository } from 'src/order/repositories/order.repository';
import { CartRepository } from 'src/cart/repositories/cart.repository';
import { OrderController } from 'src/order/order.controller';

@Module({
  providers: [OrderService, OrderRepository, CartRepository],
  exports: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
