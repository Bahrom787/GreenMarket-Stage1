import { Text } from '@/design-system/components';
import { Stack } from '@/layout';

export interface SellerFilterItem {
  id: string;
  name: string;
  selected: boolean;
}

export function SellerFilter({
  items,
  status,
  error,
  onToggle,
  testId,
}: {
  items: SellerFilterItem[];
  status: 'loading' | 'ready' | 'error';
  error?: string;
  onToggle: (id: string) => void;
  testId: string;
}) {
  return (
    <Stack gap="xs" data-testid={testId}>
      {items.map((seller) => (
        <label key={seller.id} className="gm-search-filter-option">
          <input type="checkbox" checked={seller.selected} disabled={status === 'loading'} onChange={() => onToggle(seller.id)} />
          <span>{seller.name}</span>
        </label>
      ))}
      {status === 'loading' && <Text tone="secondary">Продавцы загружаются</Text>}
      {status === 'error' && <Text tone="secondary">{error}</Text>}
      {status === 'ready' && items.length === 0 && <Text tone="secondary">Продавцы не найдены</Text>}
    </Stack>
  );
}
