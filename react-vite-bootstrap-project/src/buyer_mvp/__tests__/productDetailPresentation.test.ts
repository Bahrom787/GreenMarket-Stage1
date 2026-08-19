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
  it('keeps Global Product Detail photos inside their seller offers', () => {
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
          photos: ['a1.jpg', 'a2.jpg'],
        },
        {
          seller_product_id: 101,
          seller_id: 2,
          seller_name: 'Магазин B',
          price: '135.00',
          unit: 'шт',
          stock: null,
          description: 'Второе предложение',
          photos: ['b1.jpg', 'b2.jpg'],
        },
      ],
    };

    const vm = toGlobalProductDetail(product);

    expect(vm).toMatchObject({
      context: 'GLOBAL',
      title: 'Аджика',
      description: 'Соус',
      offersTitle: 'Предложения продавцов (2)',
      offers: [
        {
          sellerName: 'Магазин A',
          photos: ['a1.jpg', 'a2.jpg'],
          priceText: '125 ₽ / шт',
          stockText: 'Остаток: 29 шт',
        },
        {
          sellerName: 'Магазин B',
          photos: ['b1.jpg', 'b2.jpg'],
          priceText: '135 ₽ / шт',
          stockText: undefined,
        },
      ],
    });
    expect(vm).not.toHaveProperty('photos');
  });

  it('does not move photos across Global Product Detail offers', () => {
    const vm = toGlobalProductDetail({
      id: 18,
      name: 'Авокадо',
      description: null,
      offers: [
        {
          seller_product_id: 1,
          seller_id: 1,
          seller_name: 'A',
          price: '120.00',
          unit: 'шт',
          stock: null,
          description: null,
          photos: ['a.jpg'],
        },
        {
          seller_product_id: 2,
          seller_id: 2,
          seller_name: 'B',
          price: '130.00',
          unit: 'шт',
          stock: null,
          description: null,
          photos: ['b.jpg'],
        },
        {
          seller_product_id: 3,
          seller_id: 3,
          seller_name: 'C',
          price: '140.00',
          unit: 'шт',
          stock: null,
          description: null,
          photos: ['c.jpg'],
        },
      ],
    });

    expect(vm.offers.map((offer) => offer.photos)).toEqual([['a.jpg'], ['b.jpg'], ['c.jpg']]);
  });

  it('keeps empty offer photos empty without using another seller photo', () => {
    const vm = toGlobalProductDetail({
      id: 19,
      name: 'Айва',
      description: null,
      offers: [
        {
          seller_product_id: 1,
          seller_id: 1,
          seller_name: 'A',
          price: '210.00',
          unit: 'кг',
          stock: null,
          description: null,
          photos: [],
        },
        {
          seller_product_id: 2,
          seller_id: 2,
          seller_name: 'B',
          price: '215.00',
          unit: 'кг',
          stock: null,
          description: null,
          photos: ['b1.jpg'],
        },
      ],
    });

    expect(vm.offers[0].photos).toEqual([]);
    expect(vm.offers[1].photos).toEqual(['b1.jpg']);
  });

  it('keeps Store Product Detail scoped to the current seller offer', () => {
    const vm = toStoreProductDetail(storeProduct, seller);

    expect(vm).toMatchObject({
      context: 'STORE',
      title: 'Аджика домашняя',
      subtitle: 'Магазин A',
      offersTitle: 'Предложение магазина',
      offers: [
        {
          key: 'store-404',
          photos: ['store.jpg'],
          priceText: '125 ₽ / шт',
          stockText: 'Остаток: 0 шт',
          description: 'Острая аджика',
        },
      ],
    });
    expect(vm.offers).toHaveLength(1);
    expect(vm.offers[0]).not.toHaveProperty('sellerName');
    expect(vm).not.toHaveProperty('photos');
  });

  it('does not invent missing Store Product Detail values', () => {
    const vm = toStoreProductDetail({ ...storeProduct, price: '', stock: null }, seller);

    expect(vm.offers[0].priceText).toBe('Цена не указана');
    expect(vm.offers[0].stockText).toBeUndefined();
  });
});
