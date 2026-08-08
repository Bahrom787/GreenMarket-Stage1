interface PhotoPlaceholderProps {
  label: string;
}

/** Buyer_MVP.md, "Фотографии": если фото нет — заглушка платформы. */
export function PhotoPlaceholder({ label }: PhotoPlaceholderProps) {
  return (
    <div className="gm-buyer-photo gm-buyer-photo--placeholder" role="img" aria-label={label}>
      🥬
    </div>
  );
}
