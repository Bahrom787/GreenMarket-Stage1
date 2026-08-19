import { formatOfferCount, formatPrice, formatStock } from './format';
import type { ProductListItem, SellerCatalogItem } from './types';

export interface CatalogProductCardViewModel {
  key: string;
  id: number;
  name: string;
  photos: string[];
  priceText: string;
  metaText?: string;
}

export function toGlobalProductCard(product: ProductListItem): CatalogProductCardViewModel {
  return {
    key: `global-${product.id}`,
    id: product.id,
    name: product.name,
    photos: product.photos,
    priceText: `${product.offer_count > 1 ? 'от ' : ''}${formatPrice(product.min_price)}`,
    metaText: product.offer_count > 1 ? formatOfferCount(product.offer_count) : undefined,
  };
}

export function toStoreProductCard(product: SellerCatalogItem): CatalogProductCardViewModel {
  return {
    key: `store-${product.seller_product_id}`,
    id: product.product_id,
    name: product.name || product.catalog_name,
    photos: product.photos,
    priceText: `${formatPrice(product.price)} / ${product.unit}`,
    metaText: product.stock ? `Остаток: ${formatStock(product.stock, product.unit)}` : undefined,
  };
}
