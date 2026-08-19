import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Text, Loader, ErrorState, Button } from '@/design-system/components';
import { Stack, Row } from '@/layout';
import { fetchProduct, fetchSeller, fetchSellerProduct, CatalogApiError } from '../api';
import { OfferCard } from '../components/OfferCard';
import { PhotoStrip } from '../components/PhotoStrip';
import {
  catalogPath,
  globalCatalogContext,
  isStoreContext,
  type CatalogContext,
} from '../catalogContext';
import {
  toGlobalProductDetail,
  toStoreProductDetail,
  type ProductDetailViewModel,
} from '../productDetailPresentation';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; title: string; message: string; retryable: boolean }
  | { status: 'ready'; product: ProductDetailViewModel };

/** Экран 3 (Buyer_MVP.md): карточка товара, список предложений продавцов. */
interface ProductScreenProps {
  context?: CatalogContext;
}

export function ProductScreen({ context = globalCatalogContext }: ProductScreenProps) {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const isStore = isStoreContext(context);
  const storeId = isStore ? context.storeId : undefined;
  const detailParams = new URLSearchParams(location.search);
  const sellerProductIdParam = detailParams.get('seller_product_id');
  const sellerProductId = sellerProductIdParam ? Number(sellerProductIdParam) : undefined;

  const load = useCallback(() => {
    const id = Number(productId);
    if (!productId || Number.isNaN(id)) {
      setState({
        status: 'error',
        title: 'Товар не найден',
        message: 'Некорректный идентификатор товара.',
        retryable: false,
      });
      return;
    }
    if (isStore && !storeId) {
      setState({
        status: 'error',
        title: 'Товар не найден',
        message: 'Некорректный идентификатор магазина.',
        retryable: false,
      });
      return;
    }
    if (isStore && sellerProductIdParam && Number.isNaN(sellerProductId)) {
      setState({
        status: 'error',
        title: 'Предложение недоступно',
        message: 'Некорректный идентификатор предложения.',
        retryable: false,
      });
      return;
    }

    setState({ status: 'loading' });
    const request: Promise<ProductDetailViewModel> =
      isStore && storeId
        ? Promise.all([
            fetchSeller(storeId),
            fetchSellerProduct(storeId, id, sellerProductId),
          ]).then(([seller, product]) => toStoreProductDetail(product, seller))
        : fetchProduct(id).then(toGlobalProductDetail);

    request
      .then((product) => setState({ status: 'ready', product }))
      .catch((err: unknown) => {
        const notFound = err instanceof CatalogApiError && err.status === 404;
        const unavailable =
          err instanceof CatalogApiError && err.code === 'SELLER_PRODUCT_NOT_FOUND';
        const message =
          err instanceof CatalogApiError ? err.message : 'Не удалось загрузить карточку товара.';
        setState({
          status: 'error',
          title: unavailable
            ? 'Предложение недоступно'
            : notFound
              ? 'Товар не найден'
              : 'Не удалось загрузить товар',
          message,
          retryable: !notFound,
        });
      });
  }, [productId, isStore, storeId, sellerProductId, sellerProductIdParam]);

  useEffect(() => {
    load();
  }, [load]);

  function backToCatalog() {
    const params = new URLSearchParams(location.search);
    params.delete('seller_product_id');
    const search = params.toString();
    navigate(catalogPath(context, search ? `?${search}` : ''));
  }

  return (
    <Stack gap="lg">
      <Row align="center" justify="between">
        <Button variant="secondary" size="sm" onClick={backToCatalog}>
          Назад
        </Button>
      </Row>

      {state.status === 'loading' && <Loader size="lg" label="Загрузка товара" />}

      {state.status === 'error' && (
        <ErrorState
          title={state.title}
          description={state.message}
          action={state.retryable ? <Button onClick={load}>Повторить</Button> : undefined}
        />
      )}

      {state.status === 'ready' && (
        <div className="gm-buyer-product-detail" data-context={state.product.context}>
          <div className="gm-buyer-product-detail__gallery">
            <PhotoStrip photos={state.product.photos} label={state.product.title} />
          </div>
          <Stack gap="md" className="gm-buyer-product-detail__content">
            <Text variant="headline" as="h1">
              {state.product.title}
            </Text>
            {state.product.subtitle && <Text tone="secondary">{state.product.subtitle}</Text>}
            {state.product.description && (
              <Text variant="body" tone="secondary">
                {state.product.description}
              </Text>
            )}

            <Text variant="title" as="h2">
              {state.product.offersTitle}
            </Text>

            {state.product.offers.length === 0 ? (
              <Text tone="secondary">{state.product.emptyText}</Text>
            ) : (
              <Stack gap="md">
                {state.product.offers.map((offer) => (
                  <OfferCard
                    key={offer.key}
                    offer={offer}
                    showPhotos={false}
                    showSellerName={state.product.context === 'GLOBAL'}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </div>
      )}
    </Stack>
  );
}
