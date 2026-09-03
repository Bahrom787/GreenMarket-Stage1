import { forwardRef, useImperativeHandle } from 'react';
import { useDraggablePanel } from '@/screens/map/useDraggablePanel';
import './map.css';

const STORAGE_KEY = 'gm.legend.position';
const OBSTACLE_SELECTORS = ['.gm-header', '.gm-map-fab-panel', '[data-testid="current-area-label"]', '.gm-map-search-slot', '.gm-map-bottom-left'] as const;

export interface MapLegendHandle {
  resetPosition: () => void;
}

export interface MapLegendProps {
  onReturnRequest?: (show: boolean) => void;
}

export const MapLegend = forwardRef<MapLegendHandle, MapLegendProps>(function MapLegend({ onReturnRequest }, ref) {
  const { offset, dragging, expanded, setExpanded, panelRef, resetPosition, onDragStart, onDragMove, onDragEnd } =
    useDraggablePanel({
      storageKey: STORAGE_KEY,
      obstacleSelectors: OBSTACLE_SELECTORS,
      anchor: 'bottom-left',
      autoCollapseMs: 12000,
      onReturnRequest,
    });

  useImperativeHandle(ref, () => ({ resetPosition }), [resetPosition]);

  return (
    <div
      ref={panelRef}
      className={['gm-map-legend', expanded ? 'gm-map-legend--expanded' : '', dragging ? 'gm-map-legend--dragging' : ''].filter(Boolean).join(' ')}
      style={offset.x === 0 && offset.y === 0 ? undefined : { transform: `translate(${offset.x}px, ${offset.y}px)`, transition: dragging ? 'transform 0ms' : undefined }}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      data-testid="map-legend"
    >
      <div className="gm-map-legend__body" data-measure>
        {!expanded && (
          <button
            type="button"
            className="gm-map-tool-button gm-map-legend__toggle"
            onClick={() => setExpanded(true)}
            aria-label="Развернуть легенду"
            aria-expanded={expanded}
            data-testid="legend-toggle"
          >
            <span className="gm-map-legend__flag" aria-hidden="true">
              🏁
            </span>
          </button>
        )}

        {expanded && (
          <>
            <div className="gm-map-legend__item">
              <span className="gm-map-legend__swatch gm-map-legend__swatch--open" aria-hidden="true" />
              <span>Открыто сейчас</span>
            </div>
            <div className="gm-map-legend__item">
              <span className="gm-map-legend__swatch gm-map-legend__swatch--closed" aria-hidden="true" />
              <span>Закрыто сейчас</span>
            </div>
            <div className="gm-map-legend__item">
              <span className="gm-map-legend__swatch gm-map-legend__swatch--unknown" aria-hidden="true" />
              <span>Статус неизвестен</span>
            </div>
            <button
              type="button"
              className="gm-map-legend__collapse-btn"
              onClick={() => setExpanded(false)}
              aria-label="Свернуть легенду"
              data-testid="legend-collapse"
            >
              свернуть
            </button>
          </>
        )}

        <div className="gm-map-legend__handle" data-testid="legend-handle" />
      </div>
    </div>
  );
});
