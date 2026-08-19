import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import type { CatalogProductCardViewModel } from '../catalogPresentation';

describe('ProductCard', () => {
  const product: CatalogProductCardViewModel = {
    key: 'store-10',
    context: 'STORE',
    id: 1,
    name: 'Очень длинное название товара Green Board',
    photos: [],
    priceText: '125 ₽ / шт',
    metaText: 'Остаток: 0 шт',
  };

  it('renders context, accessible name and neutral no-image state from prepared data', () => {
    const html = renderToStaticMarkup(<ProductCard product={product} onOpen={() => undefined} />);

    expect(html).toContain('data-context="STORE"');
    expect(html).toContain('role="button"');
    expect(html).toContain('aria-label="Очень длинное название товара Green Board. 125 ₽ / шт. Остаток: 0 шт"');
    expect(html).toContain('aria-label="Нет изображения: Очень длинное название товара Green Board"');
    expect(html).toContain('GB');
  });

  it('keeps loading skeleton free from product data', () => {
    const html = renderToStaticMarkup(<ProductCardSkeleton />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('125 ₽');
    expect(html).not.toContain('Остаток');
  });
});
