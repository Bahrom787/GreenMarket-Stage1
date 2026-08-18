import { describe, expect, it } from 'vitest';
import { toGlobalProductCard, toStoreProductCard } from '../catalogPresentation';
import type { ProductListItem, SellerCatalogItem } from '../types';

describe('catalog presentation', () => {
  it('shows a plain price for one global offer and a min price for multiple offers', () => {
    const product: ProductListItem = { id: 1, name: 'Аджика', min_price: '125.00', offer_count: 1, photos: [] };

    expect(toGlobalProductCard(product).priceText).toBe('125 ₽');

    expect(toGlobalProductCard({ ...product, offer_count: 3 }).priceText).toBe('от 125 ₽');
    expect(toGlobalProductCard({ ...product, offer_count: 3 }).metaText).toBe('3 предложения');
  });

  it('keeps Store Catalog cards scoped to one seller offer', () => {
    const product: SellerCatalogItem = {
      seller_product_id: 10,
      product_id: 1,
      name: 'Аджика домашняя',
      catalog_name: 'Аджика',
      group_id: 2,
      group_name: 'Соусы',
      price: '125.00',
      unit: 'шт',
      stock: '29.000',
      description: null,
      origin_country: null,
      supply_date: null,
      photos: [],
    };

    expect(toStoreProductCard(product)).toMatchObject({
      key: 'store-10',
      id: 1,
      name: 'Аджика домашняя',
      priceText: '125 ₽ / шт',
      metaText: 'Остаток: 29 шт',
    });
  });
});
