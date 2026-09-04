import { useEffect, type ReactNode } from 'react';
import { Button } from '@/design-system/components';
import './search-filter-bar.css';

export interface SearchFilterGroup {
  id: string;
  label: string;
  count?: number;
  triggerContent?: ReactNode;
  panel: ReactNode;
  testId?: string;
  ariaLabel?: string;
}

export interface SearchFilterBarProps {
  searchSlot: ReactNode;
  entitySwitchSlot?: ReactNode;
  groups?: SearchFilterGroup[];
  openGroupId?: string | null;
  onOpenGroupChange?: (groupId: string | null) => void;
  chipsSlot?: ReactNode;
  actionsSlot?: ReactNode;
  sortSlot?: ReactNode;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  autoCollapseMs?: number;
  autoCollapseEnabled?: boolean;
  activityKey?: unknown;
  className?: string;
}

export function SearchFilterBar({
  searchSlot,
  entitySwitchSlot,
  groups = [],
  openGroupId = null,
  onOpenGroupChange,
  chipsSlot,
  actionsSlot,
  sortSlot,
  hasFilters = false,
  onClearFilters,
  autoCollapseMs,
  autoCollapseEnabled = true,
  activityKey,
  className,
}: SearchFilterBarProps) {
  const openGroup = groups.find((group) => group.id === openGroupId);

  useEffect(() => {
    if (!openGroupId || !autoCollapseMs || !autoCollapseEnabled) return;
    const timer = window.setTimeout(() => onOpenGroupChange?.(null), autoCollapseMs);
    return () => window.clearTimeout(timer);
  }, [activityKey, autoCollapseEnabled, autoCollapseMs, onOpenGroupChange, openGroupId]);

  useEffect(() => {
    if (!openGroupId) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenGroupChange?.(null);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onOpenGroupChange, openGroupId]);

  return (
    <div className={['gm-search-filter-bar', className].filter(Boolean).join(' ')}>
      <div className="gm-search-filter-bar__row">
        <div className="gm-search-filter-bar__search">{searchSlot}</div>
        {entitySwitchSlot && <div className="gm-search-filter-bar__entity-switch">{entitySwitchSlot}</div>}
        {groups.map((group) => (
          <Button
            key={group.id}
            variant={openGroupId === group.id ? 'primary' : 'secondary'}
            size="sm"
            aria-label={group.ariaLabel}
            aria-expanded={openGroupId === group.id}
            onClick={() => onOpenGroupChange?.(openGroupId === group.id ? null : group.id)}
            data-testid={group.testId ?? `search-filter-group-${group.id}`}
            className="gm-search-filter-bar__trigger"
          >
            {group.triggerContent ?? (
              <>
                <span>{group.label}</span>
                {Boolean(group.count) && <span>· {group.count}</span>}
              </>
            )}
          </Button>
        ))}
        {actionsSlot && <div className="gm-search-filter-bar__actions">{actionsSlot}</div>}
        {sortSlot && <div className="gm-search-filter-bar__sort">{sortSlot}</div>}
      </div>

      {openGroup && (
        <div className="gm-search-filter-bar__panel" data-testid={`search-filter-panel-${openGroup.id}`}>
          {openGroup.panel}
        </div>
      )}

      {(hasFilters || chipsSlot) && (
        <div className="gm-search-filter-bar__meta">
          {hasFilters && onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} data-testid="search-filter-clear">
              Очистить фильтры
            </Button>
          )}
          {chipsSlot}
        </div>
      )}
    </div>
  );
}
