import { describe, expect, it } from 'vitest';
import { catalogPath, storeCatalogContext } from '../catalogContext';
import { sellerCardProductPath, toBuyerSellerCard } from '../sellerCardPresentation';
import type { SellerCardResponse, SellerCatalogResponse } from '../types';

const seller: SellerCardResponse = {
  seller_id: 6,
  name: 'Лавка зелени',
  market: {
    id: 1,
    name: 'Центральный рынок',
    type: 'market',
    address: 'ул. Мира, 1',
    latitude: '0',
    longitude: '0',
  },
  row: 'Б',
  place: '12',
  working_hours: '09:00-18:00',
  short_description: 'Зелень и овощи',
  phone: '+79990000000',
  whatsapp: 'https://wa.me/79990000000',
};

const catalog: SellerCatalogResponse = {
  page: 1,
  limit: 12,
  total: 1,
  products: [
    {
      seller_product_id: 10,
      product_id: 42,
      name: 'Аджика',
      catalog_name: 'Аджика',
      group_id: 2,
      group_name: 'Соусы',
      price: '125.00',
      unit: 'шт',
      stock: '0',
      description: null,
      origin_country: null,
      supply_date: null,
      photos: [],
    },
  ],
};

describe('sellerCardPresentation', () => {
  it('uses only seller API fields and seller-scoped products', () => {
    expect(toBuyerSellerCard(seller, catalog)).toMatchObject({
      sellerId: '6',
      title: 'Лавка зелени',
      description: 'Зелень и овощи',
      market: 'Центральный рынок, ул. Мира, 1',
      place: 'Ряд Б, Место 12',
      workingHours: '09:00-18:00',
      actions: [
        { key: 'phone', label: 'Позвонить', href: 'tel:+79990000000' },
        { key: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/79990000000' },
      ],
      products: [
        {
          key: 'store-10',
          context: 'STORE',
          id: 42,
          sellerProductId: 10,
          priceText: '125 ₽ / шт',
          metaText: 'Остаток: 0 шт',
        },
      ],
    });
  });

  it('does not invent actions or metadata when API fields are absent', () => {
    expect(
      toBuyerSellerCard(
        {
          ...seller,
          market: null,
          row: null,
          place: null,
          working_hours: null,
          short_description: null,
          phone: null,
          whatsapp: null,
        },
        { ...catalog, products: [], total: 0 },
      ),
    ).toMatchObject({
      title: 'Лавка зелени',
      actions: [],
      products: [],
      totalProducts: 0,
    });
  });

  it('uses Store Catalog as the seller-scoped catalog action', () => {
    const vm = toBuyerSellerCard(seller, catalog);
    expect(catalogPath(storeCatalogContext(vm.sellerId))).toBe('/store/6/catalog');
  });

  it('opens Seller Card products through Store Product routes', () => {
    const vm = toBuyerSellerCard(seller, catalog);
    const href = sellerCardProductPath(vm.sellerId, vm.products[0]);

    expect(href).toBe('/store/6/product/42?seller_product_id=10');
    expect(href).not.toBe('/product/42');
  });

  it('omits seller_product_id only when it is absent', () => {
    expect(sellerCardProductPath('6', { id: 42 })).toBe('/store/6/product/42');
  });
});
