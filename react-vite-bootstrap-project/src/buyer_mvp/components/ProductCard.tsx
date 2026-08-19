import { Card, Text } from '@/design-system/components';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import type { CatalogProductCardViewModel } from '../catalogPresentation';

interface ProductCardProps {
  product: CatalogProductCardViewModel;
  onOpen: (product: CatalogProductCardViewModel) => void;
}

/** Prepared catalog card. Context and pricing semantics are resolved before JSX. */
export function ProductCard({ product, onOpen }: ProductCardProps) {
  const photo = product.photos[0];
  const accessibleName = [product.name, product.priceText, product.metaText]
    .filter(Boolean)
    .join('. ');

  return (
    <Card
      className="gm-buyer-product-card gm-focusable"
      data-context={product.context}
      role="button"
      tabIndex={0}
      aria-label={accessibleName}
      onClick={() => onOpen(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(product);
        }
      }}
    >
      {photo ? (
        <img className="gm-buyer-photo" src={photo} alt={product.name} loading="lazy" />
      ) : (
        <PhotoPlaceholder label={product.name} />
      )}
      <Text variant="bodyStrong" as="h3" className="gm-buyer-product-card__title">
        {product.name}
      </Text>
      <Text variant="body" tone="secondary" className="gm-buyer-product-card__price">
        {product.priceText}
      </Text>
      {product.metaText && (
        <Text variant="caption" tone="tertiary" className="gm-buyer-product-card__meta">
          {product.metaText}
        </Text>
      )}
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="gm-buyer-product-card gm-buyer-product-card--skeleton" aria-hidden="true">
      <div className="gm-buyer-photo gm-buyer-card-skeleton__media" />
      <div className="gm-buyer-card-skeleton__line gm-buyer-card-skeleton__line--title" />
      <div className="gm-buyer-card-skeleton__line gm-buyer-card-skeleton__line--title-short" />
      <div className="gm-buyer-card-skeleton__line gm-buyer-card-skeleton__line--price" />
      <div className="gm-buyer-card-skeleton__line gm-buyer-card-skeleton__line--meta" />
    </Card>
  );
}
