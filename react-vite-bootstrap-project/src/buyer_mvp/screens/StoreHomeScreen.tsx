import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, ErrorState, Loader, Text } from '@/design-system/components';
import { Row, Stack } from '@/layout';
import { trackEvent } from '@/shared/analytics/AnalyticsReporter';
import { CatalogApiError, fetchSeller } from '../api';
import { catalogPath, globalStoreModeSearch, storeCatalogContext } from '../catalogContext';
import { StoreQrPrint } from '../components/StoreQrPrint';
import { toStoreHome, type StoreHomeViewModel } from '../storeHomePresentation';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; title: string; message?: string; retryable: boolean }
  | { status: 'ready'; store: StoreHomeViewModel };

function StoreInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="gm-store-home__info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export interface StoreHomeScreenProps {
  storeIdOverride?: string;
  publicCatalogPath?: string;
}

export function StoreHomeScreen({ storeIdOverride, publicCatalogPath }: StoreHomeScreenProps = {}) {
  const { storeId: routeStoreId } = useParams<{ storeId: string }>();
  const storeId = storeIdOverride ?? routeStoreId;
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    if (!storeId) {
      setState({
        status: 'error',
        title: 'Магазин не найден',
        message: 'Некорректный идентификатор магазина.',
        retryable: false,
      });
      return;
    }

    setState({ status: 'loading' });
    fetchSeller(storeId)
      .then((seller) => {
        setState({ status: 'ready', store: toStoreHome(seller) });
        trackEvent('store_open', { seller_id: Number(storeId) });
      })
      .catch((err: unknown) => {
        const notFound = err instanceof CatalogApiError && err.status === 404;
        setState({
          status: 'error',
          title: notFound ? 'Магазин не найден' : 'Не удалось загрузить магазин',
          message: notFound
            ? undefined
            : err instanceof CatalogApiError
              ? err.message
              : 'Не удалось загрузить данные магазина.',
          retryable: !notFound,
        });
      });
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  function openCatalog() {
    if (!storeId) return;

    const modeSearch = globalStoreModeSearch(location.search);
    trackEvent('store_catalog_open', { seller_id: Number(storeId) });
    navigate(publicCatalogPath ?? catalogPath(storeCatalogContext(storeId), modeSearch), { replace: Boolean(modeSearch) });
  }

  return (
    <Stack gap="xl" className="gm-store-home">
      {state.status === 'loading' && <Loader size="lg" label="Загрузка магазина" />}

      {state.status === 'error' && (
        <ErrorState
          title={state.title}
          description={state.message}
          action={state.retryable ? <Button onClick={load}>Повторить</Button> : undefined}
        />
      )}

      {state.status === 'ready' && (
        <>
          <Stack gap="md" className="gm-store-home__head">
            <Text variant="headline" as="h1">
              {state.store.title}
            </Text>
            {state.store.description && (
              <Text variant="body" tone="secondary">
                {state.store.description}
              </Text>
            )}
            <Row gap="sm" wrap>
              <Button onClick={openCatalog}>Перейти в каталог</Button>
              <StoreQrPrint store={state.store} />
            </Row>
          </Stack>

          {(state.store.market || state.store.place || state.store.workingHours) && (
            <section aria-labelledby="store-info-title" className="gm-store-home__section">
              <Text variant="title" as="h2" id="store-info-title">
                Информация о магазине
              </Text>
              <dl className="gm-store-home__info">
                {state.store.market && <StoreInfoRow label="Рынок" value={state.store.market} />}
                {state.store.place && <StoreInfoRow label="Место" value={state.store.place} />}
                {state.store.workingHours && (
                  <StoreInfoRow label="Часы работы" value={state.store.workingHours} />
                )}
              </dl>
            </section>
          )}
        </>
      )}
    </Stack>
  );
}
