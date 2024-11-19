import { Module } from '@nestjs/common';

import { OrderModule } from '../order/order.module';

import { CartController } from './cart.controller';
import { CartService } from './services';
import { CartRepository } from './repositories/cart.repository';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [OrderModule, HttpModule],
  providers: [CartService, CartRepository],
  controllers: [CartController],
})
export class CartModule {}
