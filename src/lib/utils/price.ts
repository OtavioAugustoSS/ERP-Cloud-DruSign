import { Product } from '@prisma/client';

/**
 * Calculates the price for a product based on its dimensions (width, height in meters)
 * and its configuration (pricePerSqMeter, minPrice).
 */
export const calculatePrice = (
  width: number,
  height: number,
  product: Pick<Product, 'pricePerSqMeter' | 'minPrice' | 'isFixedPrice'>
): number => {
  if (product.isFixedPrice || !product.pricePerSqMeter) {
    return product.minPrice;
  }

  const area = width * height;
  const calculatedPrice = area * product.pricePerSqMeter;

  // Use Math.max to ensure the price is at least the minimum price
  // Round to 2 decimal places for currency
  const finalPrice = Math.max(calculatedPrice, product.minPrice);
  
  return Number(finalPrice.toFixed(2));
};
