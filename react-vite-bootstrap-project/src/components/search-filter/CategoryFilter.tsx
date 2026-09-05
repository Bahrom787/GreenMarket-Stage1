import type { CSSProperties } from 'react';
import { Button, Chip, Text } from '@/design-system/components';
import { Row } from '@/layout';
import { FilterPanel } from './FilterPanel';

export type CategoryPanelMode = 'text' | 'icons';

export interface CategoryFilterItem {
  id: number | string;
  name: string;
  label?: string;
  depth?: number;
  selected: boolean;
  disabled?: boolean;
}

const categoryIconRules: Array<{ test: RegExp; kind: string }> = [
  { test: /овощ|vegetable|огур|помид|карто/i, kind: 'vegetables' },
  { test: /зелень|салат|green|salad/i, kind: 'greens' },
  { test: /фрукт|fruit|яблок|груш/i, kind: 'fruit' },
  { test: /ягод|berr/i, kind: 'berries' },
  { test: /орех|nut/i, kind: 'nuts' },
  { test: /слад|восточ|sweet/i, kind: 'sweets' },
  { test: /сухофрукт|цукат|dried/i, kind: 'dried' },
  { test: /солень|маринад|pickle/i, kind: 'pickles' },
  { test: /бакале|проч|grocery/i, kind: 'grocery' },
];

function categoryIconKind(name: string) {
  return categoryIconRules.find((rule) => rule.test.test(name))?.kind ?? 'grocery';
}

export function CategoryIcon({ name, kind }: { name?: string; kind?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`gm-catalog-category-icon gm-catalog-category-icon--${kind ?? categoryIconKind(name ?? '')}`}
    />
  );
}

export function CategoryToggleContent({ mode, count }: { mode: CategoryPanelMode; count: number }) {
  return (
    <>
      <CategoryIcon kind="grocery" />
      {mode === 'text' && <span>Категории</span>}
      {count > 0 && <span>{mode === 'text' ? `(${count})` : count}</span>}
    </>
  );
}

export function CategoryFilter({
  items,
  mode,
  autoCollapse,
  onModeChange,
  onAutoCollapseChange,
  onToggle,
  onInteract,
  loading,
  error,
  testIdPrefix,
}: {
  items: CategoryFilterItem[];
  mode: CategoryPanelMode;
  autoCollapse: boolean;
  onModeChange: (mode: CategoryPanelMode) => void;
  onAutoCollapseChange: (enabled: boolean) => void;
  onToggle: (id: CategoryFilterItem['id']) => void;
  onInteract?: () => void;
  loading?: boolean;
  error?: string;
  testIdPrefix: string;
}) {
  return (
    <FilterPanel testId={`${testIdPrefix}-category-panel-body`} onInteract={onInteract}>
      <Row gap="sm" wrap align="center">
        <Button variant={mode === 'text' ? 'primary' : 'secondary'} size="sm" onClick={() => onModeChange('text')}>
          Текст
        </Button>
        <Button variant={mode === 'icons' ? 'primary' : 'secondary'} size="sm" onClick={() => onModeChange('icons')}>
          Иконки
        </Button>
        <label className="gm-catalog-category-panel__toggle">
          <input type="checkbox" checked={autoCollapse} onChange={(event) => onAutoCollapseChange(event.currentTarget.checked)} />
          <Text variant="caption" as="span">
            Автосворачивание
          </Text>
        </label>
      </Row>
      <div
        className={`gm-catalog-category-list gm-catalog-category-list--${mode}`}
        aria-label="Категории"
        data-testid={`${testIdPrefix}-category-list`}
      >
        {items.map((item) => (
          <Chip
            key={item.id}
            selected={item.selected}
            disabled={loading || item.disabled}
            onClick={() => onToggle(item.id)}
            title={item.name}
            aria-label={mode === 'icons' ? item.name : undefined}
            className="gm-catalog-category-chip"
            style={{ '--gm-category-depth': item.depth ?? 0 } as CSSProperties}
          >
            <CategoryIcon name={item.name} />
            {mode === 'text' && <span className="gm-catalog-category-chip__label">{item.label ?? item.name}</span>}
          </Chip>
        ))}
        {loading && <Text tone="secondary">Категории загружаются</Text>}
        {error && <Text tone="secondary">{error}</Text>}
      </div>
    </FilterPanel>
  );
}

export function SelectedCategoryChips({
  items,
  mode,
  onToggle,
}: {
  items: CategoryFilterItem[];
  mode: CategoryPanelMode;
  onToggle: (id: CategoryFilterItem['id']) => void;
}) {
  return (
    <>
      {items.map((item) => (
        <Chip
          key={item.id}
          selected
          onClick={() => onToggle(item.id)}
          title={item.name}
          aria-label={mode === 'icons' ? `Убрать категорию ${item.name}` : undefined}
          className={`gm-catalog-selected-category gm-catalog-selected-category--${mode}`}
        >
          <CategoryIcon name={item.name} />
          {mode === 'text' && <span>{item.name} ×</span>}
        </Chip>
      ))}
    </>
  );
}
