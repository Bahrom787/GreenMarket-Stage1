import { describe, expect, it } from 'vitest';
import { toGlobalProductCard, toStoreProductCard } from '../catalogPresentation';
import type { ProductListItem, SellerCatalogItem } from '../types';

describe('catalog presentation', () => {
  it('shows a plain price for one global offer and a min price for multiple offers', () => {
    const product: ProductListItem = { id: 1, name: 'Аджика', min_price: '125.00', offer_count: 1, photos: [] };

    expect(toGlobalProductCard(product)).toMatchObject({ context: 'GLOBAL', priceText: '125 ₽', metaText: undefined });

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
      context: 'STORE',
      id: 1,
      name: 'Аджика домашняя',
      priceText: '125 ₽ / шт',
      metaText: 'Остаток: 29 шт',
    });
  });

  it('does not invent missing global price text', () => {
    const product = { id: 1, name: 'Аджика', min_price: null, offer_count: 3, photos: [] } as unknown as ProductListItem;

    expect(toGlobalProductCard(product)).toMatchObject({
      priceText: 'Цена не указана',
      metaText: '3 предложения',
    });
  });

  it('shows real zero stock and hides absent stock in Store Catalog cards', () => {
    const product: SellerCatalogItem = {
      seller_product_id: 10,
      product_id: 1,
      name: 'Аджика домашняя',
      catalog_name: 'Аджика',
      group_id: 2,
      group_name: 'Соусы',
      price: '125.00',
      unit: 'шт',
      stock: '0.000',
      description: null,
      origin_country: null,
      supply_date: null,
      photos: [],
    };

    expect(toStoreProductCard(product).metaText).toBe('Остаток: 0 шт');
    expect(toStoreProductCard({ ...product, stock: null }).metaText).toBeUndefined();
    expect(toStoreProductCard({ ...product, price: '' }).priceText).toBe('Цена не указана');
  });
});
