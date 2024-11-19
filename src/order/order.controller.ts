import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderService } from './services/order.service';
import { AppRequest, getUserIdFromRequest } from '../shared';
import { BasicAuthGuard } from '../auth';

@Controller('api/profile/order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @UseGuards(BasicAuthGuard)
  @Get(':orderId')
  async getOrderById(@Param('orderId') orderId: string) {
    const order = await this.orderService.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
