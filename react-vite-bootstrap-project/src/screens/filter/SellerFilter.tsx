import { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from '@/design-system/components';
import type { CategoryOption } from '@/platform-core/map/repository/SellerRepository';
import {
  buildSellerFilters,
  type SellerFilterGroup,
  type SellerFiltersState,
} from '@/platform-core/map/filters/SellerFilters';
import './filter.css';

export interface SellerFilterProps {
  categories: CategoryOption[];
  selectedFilters: SellerFiltersState;
  onChange: (groupId: string, optionIds: string[]) => void;
}

/** Выпадающий фильтр продавцов с несколькими методами (группами). Общая
 *  сущность для карты и списка продавцов: состояние выбора живёт в MapRuntime
 *  (selectedFilters), сюда приходит только отображение и колбэк — смена
 *  фильтра в одном месте сразу применяется в другом.
 *
 *  Группы и чекбоксы описываются конфигом buildSellerFilters (категории +
 *  состояние): добавление нового метода/чекбокса не меняет этот компонент.
 *  Клик по заголовку метода раскрывает/сворачивает его чекбоксы под ним.
 *
 *  Семантика: пустой выбор группы = не фильтрует (для категорий это «Все»);
 *  между группами условия складываются (И). Стили — в filter.css
 *  (классы gm-seller-filter*). */
export function SellerFilter({ categories, selectedFilters, onChange }: SellerFilterProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement | null>(null);

  const groups = buildSellerFilters(categories);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleOptionToggle = useCallback(
    (group: SellerFilterGroup, optionId: string) => {
      const current = selectedFilters[group.id] ?? [];
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      onChange(group.id, next);
    },
    [selectedFilters, onChange],
  );

  const handleClearGroup = useCallback(
    (group: SellerFilterGroup) => onChange(group.id, []),
    [onChange],
  );

  // Закрытие по клику вне дропдауна и по Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Сводка активных фильтров на кнопке-триггере.
  const activeParts = groups
    .map((group) => {
      const selected = selectedFilters[group.id] ?? [];
      if (selected.length === 0) return '';
      return `${group.label}: ${selected.length}`;
    })
    .filter(Boolean);
  const summary = activeParts.length > 0 ? activeParts.join(' · ') : 'Все';

  return (
    <div className="gm-seller-filter" ref={containerRef} data-testid="seller-filter">
      <button
        type="button"
        className="gm-seller-filter__trigger gm-focusable"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Фильтр продавцов"
        data-testid="seller-filter-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <Text variant="bodyStrong" as="span">
          Фильтр
        </Text>
        <span className="gm-seller-filter__trigger-summary" data-testid="seller-filter-summary">
          {summary}
        </span>
      </button>

      {open && (
        <div className="gm-seller-filter__popover" data-testid="seller-filter-popover">
          {groups.map((group) => {
            const expanded = expandedGroups.has(group.id);
            const selected = selectedFilters[group.id] ?? [];
            const isAll = selected.length === 0;
            return (
              <div key={group.id} className="gm-seller-filter__group" data-testid={`seller-filter-group-${group.id}`}>
                <button
                  type="button"
                  className="gm-seller-filter__group-header gm-focusable"
                  aria-expanded={expanded}
                  onClick={() => toggleGroup(group.id)}
                  data-testid={`seller-filter-group-header-${group.id}`}
                >
                  <Text variant="bodyStrong" as="span">
                    {group.label}
                  </Text>
                  <span className="gm-seller-filter__chevron" aria-hidden="true">
                    {expanded ? '▾' : '▸'}
                  </span>
                </button>

                {expanded && (
                  <div className="gm-seller-filter__options" data-testid={`seller-filter-options-${group.id}`}>
                    {group.allLabel && (
                      <label className="gm-seller-filter__option" data-testid={`seller-filter-option-${group.id}-all`}>
                        <input
                          type="checkbox"
                          checked={isAll}
                          onChange={() => handleClearGroup(group)}
                          data-testid={`seller-filter-${group.id}-all`}
                        />
                        <span>{group.allLabel}</span>
                      </label>
                    )}
                    {group.options.map((option) => {
                      const checked = selected.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className="gm-seller-filter__option"
                          data-testid={`seller-filter-option-${group.id}-${option.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleOptionToggle(group, option.id)}
                            data-testid={`seller-filter-${group.id}-${option.id}`}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
