import { formatPrice, formatStock } from './format';
import type { ProductDetail, SellerCardResponse, SellerCatalogItem } from './types';

export type ProductDetailContext = 'GLOBAL' | 'STORE';

export interface ProductDetailOfferViewModel {
  key: string;
  sellerName?: string;
  photos: string[];
  priceText: string;
  stockText?: string;
  description?: string | null;
}

export interface ProductDetailViewModel {
  context: ProductDetailContext;
  title: string;
  subtitle?: string;
  description?: string | null;
  offersTitle: string;
  emptyText?: string;
  offers: ProductDetailOfferViewModel[];
}

function hasValue(value: string | null | undefined): value is string {
  return value != null && value.trim() !== '';
}

function cleanPhotos(photos: string[] | undefined) {
  return (photos ?? []).filter(hasValue);
}

function formatUnitPrice(price: string | null | undefined, unit: string | null | undefined) {
  const priceText = formatPrice(price);
  return hasValue(price) && hasValue(unit) ? `${priceText} / ${unit}` : priceText;
}

function toStockText(stock: string | null | undefined, unit: string | null | undefined) {
  if (!hasValue(stock)) return undefined;
  return `Остаток: ${formatStock(stock, unit ?? '').trim()}`;
}

export function toGlobalProductDetail(product: ProductDetail): ProductDetailViewModel {
  const offers = product.offers.map((offer) => ({
    key: `global-${offer.seller_product_id}`,
    sellerName: hasValue(offer.seller_name) ? offer.seller_name : undefined,
    photos: cleanPhotos(offer.photos),
    priceText: formatUnitPrice(offer.price, offer.unit),
    stockText: toStockText(offer.stock, offer.unit),
    description: offer.description,
  }));

  return {
    context: 'GLOBAL',
    title: product.name,
    description: product.description,
    offersTitle: `Предложения продавцов (${offers.length})`,
    emptyText: 'Сейчас нет доступных предложений.',
    offers,
  };
}

export function toStoreProductDetail(
  product: SellerCatalogItem,
  seller: SellerCardResponse,
): ProductDetailViewModel {
  const title = product.name || product.catalog_name;
  const photos = cleanPhotos(product.photos);

  return {
    context: 'STORE',
    title,
    subtitle: seller.name,
    offersTitle: 'Предложение магазина',
    offers: [
      {
        key: `store-${product.seller_product_id}`,
        photos,
        priceText: formatUnitPrice(product.price, product.unit),
        stockText: toStockText(product.stock, product.unit),
        description: product.description,
      },
    ],
  };
}
