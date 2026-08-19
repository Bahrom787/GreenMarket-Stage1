import { formatOfferCount, formatPrice, formatStock } from './format';
import type { ProductListItem, SellerCatalogItem } from './types';

export type ProductCardContext = 'GLOBAL' | 'STORE';

export interface CatalogProductCardViewModel {
  key: string;
  context: ProductCardContext;
  id: number;
  name: string;
  photos: string[];
  priceText: string;
  metaText?: string;
}

function hasValue(value: string | null | undefined) {
  return value != null && value.trim() !== '';
}

export function toGlobalProductCard(product: ProductListItem): CatalogProductCardViewModel {
  const hasPrice = hasValue(product.min_price);
  const hasMultipleOffers = product.offer_count > 1;
  const priceText = formatPrice(product.min_price);

  return {
    key: `global-${product.id}`,
    context: 'GLOBAL',
    id: product.id,
    name: product.name,
    photos: product.photos ?? [],
    priceText: hasMultipleOffers && hasPrice ? `от ${priceText}` : priceText,
    metaText: hasMultipleOffers ? formatOfferCount(product.offer_count) : undefined,
  };
}

export function toStoreProductCard(product: SellerCatalogItem): CatalogProductCardViewModel {
  const stock = hasValue(product.stock) ? String(product.stock) : undefined;
  const hasPrice = hasValue(product.price);
  const priceText = formatPrice(product.price);

  return {
    key: `store-${product.seller_product_id}`,
    context: 'STORE',
    id: product.product_id,
    name: product.name || product.catalog_name,
    photos: product.photos ?? [],
    priceText: hasPrice && product.unit ? `${priceText} / ${product.unit}` : priceText,
    metaText: stock ? `Остаток: ${formatStock(stock, product.unit)}` : undefined,
  };
}
