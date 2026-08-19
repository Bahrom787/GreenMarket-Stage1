import { describe, expect, it } from 'vitest';
import { toGlobalProductDetail, toStoreProductDetail } from '../productDetailPresentation';
import type { ProductDetail, SellerCardResponse, SellerCatalogItem } from '../types';

const seller: SellerCardResponse = {
  seller_id: 6,
  name: 'Магазин A',
  market: null,
  row: null,
  place: null,
  working_hours: null,
  short_description: null,
  phone: null,
  whatsapp: null,
};

const storeProduct: SellerCatalogItem = {
  seller_product_id: 404,
  product_id: 17,
  name: 'Аджика домашняя',
  catalog_name: 'Аджика',
  group_id: 2,
  group_name: 'Соусы',
  price: '125.00',
  unit: 'шт',
  stock: '0.000',
  description: 'Острая аджика',
  origin_country: null,
  supply_date: null,
  photos: ['store.jpg'],
};

describe('product detail presentation', () => {
  it('keeps Global Product Detail as marketplace product with seller offers', () => {
    const product: ProductDetail = {
      id: 17,
      name: 'Аджика',
      description: 'Соус',
      offers: [
        {
          seller_product_id: 100,
          seller_id: 1,
          seller_name: 'Магазин A',
          price: '125.00',
          unit: 'шт',
          stock: '29.000',
          description: null,
          photos: ['a.jpg'],
        },
        {
          seller_product_id: 101,
          seller_id: 2,
          seller_name: 'Магазин B',
          price: '135.00',
          unit: 'шт',
          stock: null,
          description: 'Второе предложение',
          photos: ['b.jpg'],
        },
      ],
    };

    expect(toGlobalProductDetail(product)).toMatchObject({
      context: 'GLOBAL',
      title: 'Аджика',
      description: 'Соус',
      photos: ['a.jpg', 'b.jpg'],
      offersTitle: 'Предложения продавцов (2)',
      offers: [
        { sellerName: 'Магазин A', priceText: '125 ₽ / шт', stockText: 'Остаток: 29 шт' },
        { sellerName: 'Магазин B', priceText: '135 ₽ / шт', stockText: undefined },
      ],
    });
  });

  it('keeps Store Product Detail scoped to the current seller offer', () => {
    const vm = toStoreProductDetail(storeProduct, seller);

    expect(vm).toMatchObject({
      context: 'STORE',
      title: 'Аджика домашняя',
      subtitle: 'Магазин A',
      description: 'Острая аджика',
      photos: ['store.jpg'],
      offersTitle: 'Предложение магазина',
      offers: [{ key: 'store-404', priceText: '125 ₽ / шт', stockText: 'Остаток: 0 шт' }],
    });
    expect(vm.offers).toHaveLength(1);
    expect(vm.offers[0]).not.toHaveProperty('sellerName');
  });

  it('does not invent missing Store Product Detail values', () => {
    const vm = toStoreProductDetail({ ...storeProduct, price: '', stock: null }, seller);

    expect(vm.offers[0].priceText).toBe('Цена не указана');
    expect(vm.offers[0].stockText).toBeUndefined();
  });
});
