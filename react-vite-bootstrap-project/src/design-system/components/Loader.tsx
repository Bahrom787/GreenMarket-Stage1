export interface LoaderProps {
  size?: 'md' | 'lg';
  label?: string;
}

/** Indeterminate loading indicator. */
export function Loader({ size = 'md', label = 'Загрузка' }: LoaderProps) {
  return (
    <span
      className={['gm-loader', size === 'lg' ? 'gm-loader--lg' : ''].filter(Boolean).join(' ')}
      role="status"
      aria-label={label}
    />
  );
}
