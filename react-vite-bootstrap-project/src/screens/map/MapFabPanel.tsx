import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { useDraggablePanel } from '@/screens/map/useDraggablePanel';
import './map.css';

const STORAGE_KEY = 'gm.fab-panel.position';
const OBSTACLE_SELECTORS = ['.gm-site-header', '.gm-map-controls', '[data-testid="current-area-label"]', '.gm-map-legend'] as const;

export interface MapFabPanelHandle {
  resetPosition: () => void;
}

export interface MapFabPanelProps {
  children: ReactNode;
  onReturnRequest?: (show: boolean) => void;
}

export const MapFabPanel = forwardRef<MapFabPanelHandle, MapFabPanelProps>(function MapFabPanel({ children, onReturnRequest }, ref) {
  const { offset, dragging, expanded, setExpanded, panelRef, resetPosition, onDragStart, onDragMove, onDragEnd } =
    useDraggablePanel({
      storageKey: STORAGE_KEY,
      obstacleSelectors: OBSTACLE_SELECTORS,
      anchor: 'bottom-right',
      autoCollapseMs: 8000,
      onReturnRequest,
    });

  useImperativeHandle(ref, () => ({ resetPosition }), [resetPosition]);

  return (
    <div
      ref={panelRef}
      className={['gm-map-fab-panel', expanded ? 'gm-map-fab-panel--expanded' : '', dragging ? 'gm-map-fab-panel--dragging' : ''].filter(Boolean).join(' ')}
      style={offset.x === 0 && offset.y === 0 ? undefined : { transform: `translate(${offset.x}px, ${offset.y}px)`, transition: dragging ? 'transform 0ms' : undefined }}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      data-testid="fab-panel"
    >
      <div className="gm-map-fab-panel__body" data-measure>
        <button
          type="button"
          className="gm-map-fab-panel__toggle"
          onClick={() => setExpanded((current) => !current)}
          aria-label={expanded ? 'Свернуть панель инструментов' : 'Открыть панель инструментов'}
          aria-expanded={expanded}
          data-testid="fab-panel-toggle"
        >
          <span className={['gm-map-fab-panel__chevron', expanded ? '' : 'gm-map-fab-panel__chevron--up'].filter(Boolean).join(' ')} />
        </button>
        {expanded && children}
        <div className="gm-map-fab-panel__handle" data-testid="fab-panel-handle" />
      </div>
    </div>
  );
});
