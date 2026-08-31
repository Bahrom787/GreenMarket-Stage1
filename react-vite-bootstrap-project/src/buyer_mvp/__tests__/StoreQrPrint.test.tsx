import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StoreQrPrint, StoreQrPrintMaterial } from '../components/StoreQrPrint';
import type { StoreHomeViewModel } from '../storeHomePresentation';

const store: StoreHomeViewModel = {
  sellerId: '6',
  title: 'Dev marker',
  publicIdentity: {
    sellerId: 6,
    publicSlug: 'dev-marker',
    publicUrl: 'https://dev-marker.example/',
  },
};

describe('StoreQrPrint', () => {
  it('does not render QR tools when public identity is absent', () => {
    expect(renderToStaticMarkup(<StoreQrPrint store={{ sellerId: '6', title: 'Dev marker' }} />)).toBe('');
  });

  it('renders the QR action when public identity is available', () => {
    expect(renderToStaticMarkup(<StoreQrPrint store={store} />)).toContain('Печать QR-кода');
  });

  it('renders a QR material without visible technical URLs or seller ids', () => {
    const html = renderToStaticMarkup(
      <StoreQrPrintMaterial store={store} publicUrl={store.publicIdentity!.publicUrl} />,
    );

    expect(html).toContain('<svg');
    expect(html).toContain('Dev marker');
    expect(html).toContain('Откройте магазин камерой телефона');
    expect(html).not.toContain('vercel.app');
    expect(html).not.toContain('/store/6');
    expect(html).not.toContain('seller_id');
  });
});
