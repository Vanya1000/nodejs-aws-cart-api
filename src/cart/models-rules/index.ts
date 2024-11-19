import { Cart, CartItem, CartWithPopulatedItems } from '../models';

/**
 * @param {CartWithPopulatedItems} cart
 * @returns {number}
 */
export function calculateCartTotal(cart: CartWithPopulatedItems): number {
  return cart
    ? cart.items.reduce((acc: number, item) => {
        const {
          product: { price },
          count,
        } = item;
        return acc + price * count;
      }, 0)
    : 0;
}
