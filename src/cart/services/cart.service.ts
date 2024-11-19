import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cart, CartWithPopulatedItems, Product } from '../models';
import { CartRepository } from 'src/cart/repositories/cart.repository';
import { CartItemDto } from 'src/cart/dto/create-item.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  productServiceUrl: string;

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly httpService: HttpService,
  ) {
    this.productServiceUrl = process.env.PRODUCT_SERVICE_URL;
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    try {
      let cart = await this.cartRepository.findCartByUserId(userId);
      if (!cart) {
        cart = await this.cartRepository.createCartByUserId(userId);
      }
      return cart;
    } catch (error) {
      this.logger.error('Failed to find or create cart', {
        userId,
        error: error.message,
      });
      throw new BadRequestException('Could not find or create cart');
    }
  }

  async findOrCreateByUserIdPopulated(
    userId: string,
  ): Promise<CartWithPopulatedItems> {
    try {
      const cart = await this.findOrCreateByUserId(userId);
      const populatedCart = await this.populateCartWithProductDetails(cart);
      return populatedCart;
    } catch (error) {
      this.logger.error('Failed to populate cart with product details', {
        userId,
        error: error.message,
      });
      throw new BadRequestException('Could not retrieve populated cart');
    }
  }

  async updateByUserId(
    userId: string,
    { count, product }: CartItemDto,
  ): Promise<void> {
    try {
      const { id: cartId, items: cartItems } = await this.findOrCreateByUserId(
        userId,
      );
      const existingCartItem = cartItems.find(
        (item) => item.productId === product.id,
      );

      if (existingCartItem) {
        if (count === 0) {
          await this.cartRepository.removeCartItem(cartId, product.id);
        } else {
          await this.cartRepository.updateCartItemCount(
            cartId,
            product.id,
            count,
          );
        }
      } else {
        await this.cartRepository.addCartItem(cartId, product.id, count);
      }
    } catch (error) {
      this.logger.error('Failed to update cart', {
        userId,
        error: error.message,
      });
      throw new BadRequestException('Could not update cart');
    }
  }

  async removeByUserId(userId: string): Promise<void> {
    try {
      const cart = await this.cartRepository.findCartByUserId(userId);
      if (!cart) {
        this.logger.warn('Cart not found for user during removal', { userId });
        throw new NotFoundException('Cart not found');
      }
      await this.cartRepository.deleteCartById(cart.id);
      this.logger.log('Cart successfully removed', { userId });
    } catch (error) {
      this.logger.error('Failed to remove cart', {
        userId,
        error: error.message,
      });
      throw new BadRequestException('Could not remove cart');
    }
  }

  private async fetchProductDetailsBatch(
    productIds: string[],
  ): Promise<Product[]> {
    try {
      const response = await lastValueFrom(
        this.httpService.post<Product[]>(
          `${this.productServiceUrl}/products/batch`,
          { productIds },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch product details in batch', {
        productIds,
        error: error.message,
      });
      throw new NotFoundException('Failed to fetch product details');
    }
  }

  private async populateCartWithProductDetails(
    cart: Cart,
  ): Promise<CartWithPopulatedItems> {
    if (cart.items.length === 0) {
      return { ...cart, items: [] };
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await this.fetchProductDetailsBatch(productIds);

    const productMap = new Map<string, Product>();
    for (const product of products) {
      productMap.set(product.id, product);
    }

    const itemsWithDetails = cart.items.map((item) => {
      const productDetails = productMap.get(item.productId);
      if (!productDetails) {
        this.logger.warn('Product details not found for productId', {
          productId: item.productId,
        });
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }
      return {
        count: item.count,
        product: productDetails,
      };
    });

    return { ...cart, items: itemsWithDetails };
  }
}
