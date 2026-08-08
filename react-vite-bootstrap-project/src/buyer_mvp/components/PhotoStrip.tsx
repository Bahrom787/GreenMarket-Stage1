import { useState } from 'react';
import { PhotoPlaceholder } from './PhotoPlaceholder';

interface PhotoStripProps {
  photos: string[];
  label: string;
}

/**
 * Лента фото предложения (offer.photos[] — все, не только первое).
 * Источник поля: catalog_schemas.py — SellerOffer.photos, в детальном ответе
 * /catalog/products/{id} фото лежат внутри offers[], не на уровне продукта.
 */
export function PhotoStrip({ photos, label }: PhotoStripProps) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return <PhotoPlaceholder label={label} />;
  }

  return (
    <div className="gm-buyer-photo-strip">
      <img className="gm-buyer-photo gm-buyer-photo-strip__main" src={photos[active]} alt={label} loading="lazy" />
      {photos.length > 1 && (
        <div className="gm-buyer-photo-strip__thumbs" role="tablist" aria-label={`Фото: ${label}`}>
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              role="tab"
              aria-selected={index === active}
              className={`gm-buyer-photo-strip__thumb${index === active ? ' gm-buyer-photo-strip__thumb--active' : ''}`}
              onClick={() => setActive(index)}
            >
              <img src={photo} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
