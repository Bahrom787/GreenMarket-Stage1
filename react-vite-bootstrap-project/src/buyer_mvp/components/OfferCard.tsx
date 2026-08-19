import { Link } from 'react-router-dom';
import { Card, Text, Divider } from '@/design-system/components';
import { PhotoStrip } from './PhotoStrip';
import type { ProductDetailOfferViewModel } from '../productDetailPresentation';

interface OfferCardProps {
  offer: ProductDetailOfferViewModel;
  showSellerName?: boolean;
  showPhotos?: boolean;
}

/** Product Detail offer block. Data semantics are prepared before JSX. */
export function OfferCard({ offer, showSellerName = true, showPhotos = true }: OfferCardProps) {
  return (
    <Card className="gm-buyer-offer-card">
      {showPhotos && <PhotoStrip photos={offer.photos} label={offer.sellerName ?? 'Фото товара'} />}
      {showSellerName && offer.sellerName && (
        <Text variant="bodyStrong" as="h3">
          {offer.sellerName}
        </Text>
      )}
      <Text variant="title" as="p">
        {offer.priceText}
      </Text>
      {offer.stockText && (
        <Text variant="caption" tone="secondary">
          {offer.stockText}
        </Text>
      )}
      {offer.description && (
        <>
          <Divider />
          <Text variant="body" tone="secondary">
            {offer.description}
          </Text>
        </>
      )}
      {offer.storePath && (
        <Link
          to={offer.storePath}
          className="gm-button gm-button--secondary gm-button--sm gm-focusable gm-buyer-offer-card__store-link"
          aria-label={offer.storeActionLabel}
        >
          Перейти в магазин
        </Link>
      )}
    </Card>
  );
}
