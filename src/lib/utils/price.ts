import { Product } from '../../types';

export const calculatePrice = (width: number, height: number, quantity: number, product: Product | null): number => {
  if (!product || width <= 0 || height <= 0 || quantity <= 0) {
    return 0;
  }

  // Convert dimensions from cm to meters (area in m²)
  // width (cm) * height (cm) / 10000 = m²
  const areaM2 = (width * height) / 10000;

  // Base calculation
  const total = areaM2 * product.pricePerM2 * quantity;

  return parseFloat(total.toFixed(2));
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
