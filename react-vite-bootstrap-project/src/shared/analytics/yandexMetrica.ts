import {
  configureAnalytics,
  type AnalyticsAdapter,
  type AnalyticsPayload,
  type AnalyticsScreenId,
} from './AnalyticsReporter';

type YandexMetricaFn = (counterId: number, method: string, ...args: unknown[]) => void;
type QueuedMetricaFn = YandexMetricaFn & { a?: unknown[][]; l?: number };

const tagUrl = 'https://mc.yandex.ru/metrika/tag.js';

declare global {
  interface Window {
    ym?: YandexMetricaFn;
  }
}

export function createYandexMetricaAdapter(counterId: number, ym: YandexMetricaFn): AnalyticsAdapter {
  return {
    trackPageView(screen: AnalyticsScreenId, path: string, payload?: AnalyticsPayload) {
      ym(counterId, 'hit', path, { params: { screen, ...payload } });
    },
    trackEvent(name, payload) {
      ym(counterId, 'reachGoal', name, payload ?? {});
    },
  };
}

function readCounterId(): number | null {
  const raw = import.meta.env.VITE_YANDEX_METRICA_ID;
  if (!raw || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

function ensureMetricaFunction(): YandexMetricaFn {
  if (window.ym) return window.ym;

  const queued = ((counterId: number, method: string, ...args: unknown[]) => {
    queued.a = queued.a ?? [];
    queued.a.push([counterId, method, ...args]);
  }) as QueuedMetricaFn;
  queued.l = Date.now();
  window.ym = queued;
  return queued;
}

function ensureMetricaScript(): void {
  if (document.querySelector('script[data-gm-yandex-metrica]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = tagUrl;
  script.dataset.gmYandexMetrica = 'true';
  document.head.append(script);
}

export function initYandexMetrica(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const counterId = readCounterId();
  if (!counterId) {
    configureAnalytics(null);
    return false;
  }

  const ym = ensureMetricaFunction();
  ensureMetricaScript();
  ym(counterId, 'init', {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
  configureAnalytics(createYandexMetricaAdapter(counterId, ym));
  return true;
}
