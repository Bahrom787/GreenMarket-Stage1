import { describe, expect, it, vi } from 'vitest';
import { createYandexMetricaAdapter, initYandexMetrica } from '../yandexMetrica';

describe('yandexMetrica adapter', () => {
  it('does not initialize outside the browser runtime', () => {
    expect(initYandexMetrica()).toBe(false);
  });

  it('uses hit for SPA page views and reachGoal for goals', () => {
    const ym = vi.fn();
    const adapter = createYandexMetricaAdapter(123456, ym);

    adapter.trackPageView('GlobalCatalog', '/?group_id=17', { group_id: '17' });
    adapter.trackEvent('category_select', { category_id: 17 });

    expect(ym).toHaveBeenNthCalledWith(1, 123456, 'hit', '/?group_id=17', {
      params: { screen: 'GlobalCatalog', group_id: '17' },
    });
    expect(ym).toHaveBeenNthCalledWith(2, 123456, 'reachGoal', 'category_select', { category_id: 17 });
  });
});
