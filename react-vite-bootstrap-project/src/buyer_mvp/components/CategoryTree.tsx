import { Text, ListItem } from '@/design-system/components';
import { Stack } from '@/layout';
import type { ProductGroup } from '../types';

interface CategoryTreeProps {
  groups: ProductGroup[];
  onSelect: (groupId: number) => void;
}

/** Плоский список groups[] строится в дерево по parent_id (null = корень). */
export function CategoryTree({ groups, onSelect }: CategoryTreeProps) {
  const roots = groups.filter((g) => g.parent_id === null).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (parentId: number) =>
    groups.filter((g) => g.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Stack gap="xs" role="navigation" aria-label="Категории">
      {roots.map((root) => (
        <div key={root.id}>
          <ListItem onClick={() => onSelect(root.id)} trailing={<Text tone="tertiary">{root.product_count}</Text>}>
            {root.name}
          </ListItem>
          {childrenOf(root.id).length > 0 && (
            <Stack gap="xs" style={{ paddingLeft: 16 }}>
              {childrenOf(root.id).map((child) => (
                <ListItem
                  key={child.id}
                  onClick={() => onSelect(child.id)}
                  trailing={<Text tone="tertiary">{child.product_count}</Text>}
                >
                  {child.name}
                </ListItem>
              ))}
            </Stack>
          )}
        </div>
      ))}
    </Stack>
  );
}
