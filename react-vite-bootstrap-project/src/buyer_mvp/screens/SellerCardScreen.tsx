import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Loader, Text } from '@/design-system/components';
import { Grid, Row, Stack } from '@/layout';
import { trackEvent } from '@/shared/analytics/AnalyticsReporter';
import { CatalogApiError, fetchSeller, fetchSellerProducts } from '../api';
import { catalogPath, storeCatalogContext } from '../catalogContext';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import {
  sellerCardProductPath,
  toBuyerSellerCard,
  type BuyerSellerCardViewModel,
} from '../sellerCardPresentation';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; title: string; message?: string; retryable: boolean }
  | { status: 'ready'; seller: BuyerSellerCardViewModel };

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="gm-store-home__info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function SellerCardScreen() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    if (!sellerId) {
      setState({ status: 'error', title: 'Продавец не найден', retryable: false });
      return;
    }

    setState({ status: 'loading' });
    Promise.all([fetchSeller(sellerId), fetchSellerProducts(sellerId, { limit: 12 })])
      .then(([seller, catalog]) => setState({ status: 'ready', seller: toBuyerSellerCard(seller, catalog) }))
      .catch((err: unknown) => {
        const notFound = err instanceof CatalogApiError && err.status === 404;
        setState({
          status: 'error',
          title: notFound ? 'Продавец не найден' : 'Не удалось загрузить продавца',
          message: notFound ? undefined : err instanceof CatalogApiError ? err.message : undefined,
          retryable: !notFound,
        });
      });
  }, [sellerId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Stack gap="xl" className="gm-store-home">
      {state.status === 'loading' && (
        <>
          <Loader size="lg" label="Загрузка продавца" />
          <Grid gap="md" aria-label="Загрузка товаров продавца">
            {Array.from({ length: 4 }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </Grid>
        </>
      )}

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
              {state.seller.title}
            </Text>
            {state.seller.description && (
              <Text variant="body" tone="secondary">
                {state.seller.description}
              </Text>
            )}
            <Row gap="sm" wrap>
              <Button
                onClick={() => {
                  trackEvent('store_catalog_open', { seller_id: Number(state.seller.sellerId) });
                  navigate(catalogPath(storeCatalogContext(state.seller.sellerId)));
                }}
              >
                Перейти в каталог
              </Button>
              {state.seller.actions.map((action) => (
                <a key={action.key} className="gm-seller-card__action gm-focusable" href={action.href}>
                  {action.label}
                </a>
              ))}
            </Row>
          </Stack>

          {(state.seller.market || state.seller.place || state.seller.workingHours) && (
            <Card>
              <Stack gap="md">
                <Text variant="title" as="h2">
                  О продавце
                </Text>
                <dl className="gm-store-home__info">
                  {state.seller.market && <InfoRow label="Рынок" value={state.seller.market} />}
                  {state.seller.place && <InfoRow label="Место" value={state.seller.place} />}
                  {state.seller.workingHours && (
                    <InfoRow label="Часы работы" value={state.seller.workingHours} />
                  )}
                </dl>
              </Stack>
            </Card>
          )}

          <Stack gap="md">
            <Text variant="title" as="h2">
              Товары продавца
            </Text>
            {state.seller.products.length === 0 ? (
              <EmptyState title="Товаров пока нет" />
            ) : (
              <Grid gap="md">
                {state.seller.products.map((product) => (
                  <ProductCard
                    key={product.key}
                    product={product}
                    onOpen={(p) => {
                      trackEvent('store_product_open', {
                        seller_id: Number(state.seller.sellerId),
                        product_id: Number(p.id),
                      });
                      navigate(sellerCardProductPath(state.seller.sellerId, p));
                    }}
                  />
                ))}
              </Grid>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
}
