import { Card } from '@/design-system/components';
import { Text } from '@/design-system/components';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { formatPrice, formatOfferCount } from '../format';
import type { ProductListItem } from '../types';

interface ProductCardProps {
  product: ProductListItem;
  onOpen: (id: number) => void;
}

/** Экран 2 (Каталог товаров): фото, название, минимальная цена, кол-во продавцов. */
export function ProductCard({ product, onOpen }: ProductCardProps) {
  const photo = product.photos[0];

  return (
    <Card
      className="gm-buyer-product-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(product.id);
      }}
    >
      {photo ? (
        <img className="gm-buyer-photo" src={photo} alt={product.name} loading="lazy" />
      ) : (
        <PhotoPlaceholder label={product.name} />
      )}
      <Text variant="bodyStrong" as="h3">
        {product.name}
      </Text>
      <Text variant="body" tone="secondary">
        от {formatPrice(product.min_price)}
      </Text>
      <Text variant="caption" tone="tertiary">
        {formatOfferCount(product.offer_count)}
      </Text>
    </Card>
  );
}
