import { describe, expect, it } from 'vitest';
import { toStoreHome } from '../storeHomePresentation';
import type { SellerCardResponse } from '../types';

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
  phone: null,
  whatsapp: null,
};

describe('storeHomePresentation', () => {
  it('uses only seller API fields for Store Home', () => {
    expect(toStoreHome(seller)).toEqual({
      sellerId: '6',
      title: 'Лавка зелени',
      description: 'Зелень и овощи',
      market: 'Центральный рынок, ул. Мира, 1',
      place: 'Ряд Б, Место 12',
      workingHours: '09:00-18:00',
    });
  });

  it('does not invent absent Store Home data', () => {
    expect(
      toStoreHome({
        ...seller,
        market: null,
        row: null,
        place: null,
        working_hours: null,
        short_description: null,
      }),
    ).toEqual({ sellerId: '6', title: 'Лавка зелени' });
  });

  it('adds public identity only when API or configuration provides it', () => {
    expect(
      toStoreHome({
        ...seller,
        public_slug: 'lavka-zeleni',
        public_url: 'https://lavka-zeleni.example/',
      }).publicIdentity,
    ).toEqual({
      sellerId: 6,
      publicSlug: 'lavka-zeleni',
      publicUrl: 'https://lavka-zeleni.example/',
    });
  });
});
