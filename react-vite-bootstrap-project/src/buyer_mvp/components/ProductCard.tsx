import { Card, Text } from '@/design-system/components';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import type { CatalogProductCardViewModel } from '../catalogPresentation';

interface ProductCardProps {
  product: CatalogProductCardViewModel;
  onOpen: (id: number) => void;
}

/** Экран 2 (Каталог товаров): фото, название, минимальная цена, кол-во продавцов. */
export function ProductCard({ product, onOpen }: ProductCardProps) {
  const photo = product.photos[0];
  const accessibleName = [product.name, product.priceText, product.metaText].filter(Boolean).join('. ');

  return (
    <Card
      className="gm-buyer-product-card gm-focusable"
      role="button"
      tabIndex={0}
      aria-label={accessibleName}
      onClick={() => onOpen(product.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(product.id);
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
