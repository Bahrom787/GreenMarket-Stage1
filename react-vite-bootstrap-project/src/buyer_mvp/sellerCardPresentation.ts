import { toStoreHome, type StoreHomeViewModel } from './storeHomePresentation';
import { toStoreProductCard, type CatalogProductCardViewModel } from './catalogPresentation';
import { productPath, storeCatalogContext } from './catalogContext';
import type { SellerCardResponse, SellerCatalogResponse } from './types';

export interface SellerActionLink {
  key: 'phone' | 'whatsapp';
  label: string;
  href: string;
}

export interface BuyerSellerCardViewModel extends StoreHomeViewModel {
  sellerId: string;
  actions: SellerActionLink[];
  products: CatalogProductCardViewModel[];
  totalProducts: number;
}

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function toBuyerSellerCard(
  seller: SellerCardResponse,
  catalog: SellerCatalogResponse,
): BuyerSellerCardViewModel {
  const phone = clean(seller.phone);
  const whatsapp = clean(seller.whatsapp);

  return {
    ...toStoreHome(seller),
    sellerId: String(seller.seller_id),
    actions: [
      ...(phone ? [{ key: 'phone' as const, label: 'Позвонить', href: `tel:${phone}` }] : []),
      ...(whatsapp ? [{ key: 'whatsapp' as const, label: 'WhatsApp', href: whatsapp }] : []),
    ],
    products: catalog.products.map(toStoreProductCard),
    totalProducts: catalog.total,
  };
}

export function sellerCardProductPath(
  sellerId: string,
  product: Pick<CatalogProductCardViewModel, 'id' | 'sellerProductId'>,
) {
  const params = new URLSearchParams();
  if (product.sellerProductId != null) params.set('seller_product_id', String(product.sellerProductId));
  const search = params.toString();
  return productPath(storeCatalogContext(sellerId), product.id, search ? `?${search}` : '');
}
