import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addBreadcrumb,
  classifyError,
  normalizeEndpoint,
  reportException,
  reportMessage,
  sanitizeTelemetryData,
  screenFromPath,
  setErrorReporter,
} from '../ErrorReporter';

describe('ErrorReporter', () => {
  afterEach(() => {
    setErrorReporter({
      captureException: () => undefined,
      captureMessage: () => undefined,
      addBreadcrumb: () => undefined,
    });
    delete (globalThis as unknown as { __GM_TELEMETRY_EVENTS__?: unknown }).__GM_TELEMETRY_EVENTS__;
  });

  it('classifies network, http, parse and abort failures', () => {
    expect(classifyError(new TypeError('fetch failed'))).toBe('network');
    expect(classifyError(new Error('server'), 500)).toBe('http');
    expect(classifyError(new SyntaxError('bad json'))).toBe('parse');
    expect(classifyError(new DOMException('cancelled', 'AbortError'))).toBe('abort');
  });

  it('sanitizes sensitive fields and keeps only whitelisted query params', () => {
    expect(normalizeEndpoint('/products?search=milk&page=2&token=abc&group_id=17')).toBe('/products?page=2&group_id=17');
    expect(
      sanitizeTelemetryData({
        Authorization: 'Bearer secret',
        nested: { cookie: 'sid=1', seller_id: '6' },
      }),
    ).toEqual({
      Authorization: '[Filtered]',
      nested: { cookie: '[Filtered]', seller_id: '6' },
    });
  });

  it('maps paths to screen names', () => {
    expect(screenFromPath('/')).toBe('GlobalCatalog');
    expect(screenFromPath('/seller-list')).toBe('SellerList');
    expect(screenFromPath('/store/6/catalog')).toBe('StoreCatalog');
    expect(screenFromPath('/store/6/product/169')).toBe('StoreProductDetail');
  });

  it('forwards exception, message and breadcrumb through the adapter', () => {
    const adapter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      addBreadcrumb: vi.fn(),
    };
    setErrorReporter(adapter);

    reportException(new Error('boom'), { data: { token: 'secret' } });
    reportMessage('hello');
    addBreadcrumb({ category: 'api', message: 'start', data: { cookie: 'sid=1' } });

    expect(adapter.captureException.mock.calls[0][1]).toEqual({ data: { token: '[Filtered]' } });
    expect(adapter.captureMessage).toHaveBeenCalledWith('hello', undefined);
    expect(adapter.addBreadcrumb).toHaveBeenCalledWith({ category: 'api', message: 'start', data: { cookie: '[Filtered]' } });
  });
});
