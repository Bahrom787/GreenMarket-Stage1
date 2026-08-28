import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MAX_OBSTACLE_PASSES = 6;
const DEFAULT_OFFSET = { x: 0, y: 0 };
const DEFAULT_BOUNDARY_PADDING = { top: 8, right: 8, bottom: 16, left: 8 };

export interface PanelRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PanelLayout {
  anchor: 'bottom-left' | 'bottom-right';
  mapRect: { left: number; top: number; right: number; bottom: number; width: number; height: number };
  fullWidth: number;
  fullHeight: number;
  bodyWidth: number;
  bodyHeight: number;
  boundaryPadding?: Partial<typeof DEFAULT_BOUNDARY_PADDING>;
}

function getStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function loadStoredOffset(key: string): { x: number; y: number } | null {
  try {
    const raw = getStorage()?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.x === 'number' && typeof parsed?.y === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

function savePosition(key: string, pos: { x: number; y: number }) {
  getStorage()?.setItem(key, JSON.stringify(pos));
}

export function rectsOverlap(a: PanelRect, b: PanelRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function resolvePanelOffset(
  rawX: number,
  rawY: number,
  layout: PanelLayout,
  obstacles: readonly PanelRect[] = [],
): { x: number; y: number } {
  const { anchor, mapRect, fullWidth, fullHeight } = layout;
  const padding = { ...DEFAULT_BOUNDARY_PADDING, ...layout.boundaryPadding };
  const baseLeft = anchor === 'bottom-left' ? mapRect.left + 16 : mapRect.right - 16 - fullWidth;
  const baseTop = mapRect.bottom - 32 - fullHeight;

  const minX = mapRect.left + padding.left - baseLeft;
  const maxX = mapRect.right - padding.right - fullWidth - baseLeft;
  const minY = mapRect.top + padding.top - baseTop;
  const maxY = mapRect.bottom - padding.bottom - fullHeight - baseTop;

  const clamp = (value: number, min: number, max: number) =>
    min > max ? Math.round((min + max) / 2) : Math.max(min, Math.min(max, value));
  const clampX = (value: number) => clamp(value, minX, maxX);
  const clampY = (value: number) => clamp(value, minY, maxY);

  let x = clampX(rawX);
  let y = clampY(rawY);

  for (let pass = 0; pass < MAX_OBSTACLE_PASSES; pass += 1) {
    let changed = false;

    for (const obstacle of obstacles) {
      const panelRect = {
        left: baseLeft + x,
        top: baseTop + y,
        right: baseLeft + fullWidth + x,
        bottom: baseTop + fullHeight + y,
      };

      if (!rectsOverlap(panelRect, obstacle)) continue;

      const pushes = [
        { dx: -(panelRect.right - obstacle.left), dy: 0 },
        { dx: obstacle.right - panelRect.left, dy: 0 },
        { dx: 0, dy: -(panelRect.bottom - obstacle.top) },
        { dx: 0, dy: obstacle.bottom - panelRect.top },
      ];

      let best = { x, y, dist: Infinity };

      for (const push of pushes) {
        const next = { x: clampX(x + push.dx), y: clampY(y + push.dy) };
        const nextRect = {
          left: baseLeft + next.x,
          top: baseTop + next.y,
          right: baseLeft + fullWidth + next.x,
          bottom: baseTop + fullHeight + next.y,
        };
        if (rectsOverlap(nextRect, obstacle)) continue;
        const dist = (next.x - x) * (next.x - x) + (next.y - y) * (next.y - y);
        if (dist < best.dist) best = { ...next, dist };
      }

      if (best.dist !== Infinity) {
        x = best.x;
        y = best.y;
        changed = true;
      }
    }

    if (!changed) break;
  }

  return { x, y };
}

function measureObstacles(selectors: readonly string[]): PanelRect[] {
  return selectors
    .map((selector) => document.querySelector<HTMLElement>(selector))
    .filter((element): element is HTMLElement => element !== null && element.offsetHeight > 0)
    .map((element) => element.getBoundingClientRect());
}

function isDragBlocked(target: HTMLElement): boolean {
  return Boolean(target.closest('.gm-map-fab, .gm-map-fab-panel__toggle, .gm-map-legend__toggle, .gm-map-legend__collapse-btn'));
}

export interface UseDraggablePanelOptions {
  storageKey: string;
  obstacleSelectors: readonly string[];
  anchor: 'bottom-left' | 'bottom-right';
  onReturnRequest?: (show: boolean) => void;
  autoCollapseMs?: number;
}

export interface UseDraggablePanelReturn {
  offset: { x: number; y: number };
  dragging: boolean;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  panelRef: React.RefObject<HTMLDivElement>;
  resetPosition: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: () => void;
}

export function useDraggablePanel({
  storageKey,
  obstacleSelectors,
  anchor,
  onReturnRequest,
  autoCollapseMs,
}: UseDraggablePanelOptions): UseDraggablePanelReturn {
  const [expanded, setExpanded] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>(() => loadStoredOffset(storageKey) ?? { ...DEFAULT_OFFSET });
  const [dragging, setDragging] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null!);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const draggingRef = useRef(false);
  const panelSizeRef = useRef({ w: 0, h: 0 });
  const dragStateRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetPosition = useCallback(() => {
    savePosition(storageKey, DEFAULT_OFFSET);
    setOffset({ ...DEFAULT_OFFSET });
    onReturnRequest?.(false);
  }, [onReturnRequest, storageKey]);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current !== null) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const startCollapseTimer = useCallback(() => {
    clearCollapseTimer();
    if (!autoCollapseMs) return;
    collapseTimerRef.current = setTimeout(() => {
      collapseTimerRef.current = null;
      setExpanded(false);
    }, autoCollapseMs);
  }, [autoCollapseMs, clearCollapseTimer]);

  useEffect(() => {
    if (expanded && autoCollapseMs) startCollapseTimer();
    else clearCollapseTimer();
    return clearCollapseTimer;
  }, [autoCollapseMs, clearCollapseTimer, expanded, startCollapseTimer]);

  useEffect(() => {
    if (!expanded || !autoCollapseMs) return;
    const element = panelRef.current;
    if (!element) return;
    const reset = () => startCollapseTimer();
    element.addEventListener('pointerdown', reset, { passive: true });
    element.addEventListener('pointermove', reset, { passive: true });
    return () => {
      element.removeEventListener('pointerdown', reset);
      element.removeEventListener('pointermove', reset);
    };
  }, [autoCollapseMs, expanded, startCollapseTimer]);

  const measureSize = useCallback((): { w: number; h: number } => {
    const element = panelRef.current;
    if (!element) return { w: 56, h: 56 };
    const measured = element.querySelector<HTMLElement>('[data-measure]');
    return { w: measured ? measured.offsetWidth : element.offsetWidth, h: measured ? measured.offsetHeight : element.offsetHeight };
  }, []);

  const resolvePosition = useCallback(
    (rawX: number, rawY: number, bodyWidth: number, bodyHeight: number) => {
      const element = panelRef.current;
      const mapElement = element?.closest('.gm-map-screen') as HTMLElement | null;
      if (!element || !mapElement) return { x: rawX, y: rawY };

      return resolvePanelOffset(
        rawX,
        rawY,
        {
          anchor,
          mapRect: mapElement.getBoundingClientRect(),
          fullWidth: element.offsetWidth,
          fullHeight: element.offsetHeight,
          bodyWidth,
          bodyHeight,
          boundaryPadding: DEFAULT_BOUNDARY_PADDING,
        },
        measureObstacles(obstacleSelectors),
      );
    },
    [anchor, obstacleSelectors],
  );

  const clampCurrentPosition = useCallback(() => {
    const { w, h } = measureSize();
    const next = resolvePosition(offsetRef.current.x, offsetRef.current.y, w, h);
    if (next.x !== offsetRef.current.x || next.y !== offsetRef.current.y) {
      savePosition(storageKey, next);
      setOffset(next);
    }
  }, [measureSize, resolvePosition, storageKey]);

  const didMountRef = useRef(false);
  useLayoutEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;
    clampCurrentPosition();
  }, [clampCurrentPosition]);

  const prevExpandedRef = useRef(expanded);
  useLayoutEffect(() => {
    if (prevExpandedRef.current === expanded) return;
    prevExpandedRef.current = expanded;
    clampCurrentPosition();
  }, [clampCurrentPosition, expanded]);

  useEffect(() => {
    window.addEventListener('resize', clampCurrentPosition);
    window.visualViewport?.addEventListener('resize', clampCurrentPosition);
    return () => {
      window.removeEventListener('resize', clampCurrentPosition);
      window.visualViewport?.removeEventListener('resize', clampCurrentPosition);
    };
  }, [clampCurrentPosition]);

  const onDragStart = useCallback(
    (event: React.PointerEvent) => {
      const target = event.target as HTMLElement;
      if (isDragBlocked(target)) return;
      event.preventDefault();
      event.stopPropagation();
      target.setPointerCapture(event.pointerId);
      panelSizeRef.current = measureSize();
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startOffsetX: offsetRef.current.x,
        startOffsetY: offsetRef.current.y,
      };
    },
    [measureSize],
  );

  const onDragMove = useCallback(
    (event: React.PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;
      if (!draggingRef.current) {
        draggingRef.current = true;
        setDragging(true);
      }
      const rawX = dragState.startOffsetX + (event.clientX - dragState.startX);
      const rawY = dragState.startOffsetY + (event.clientY - dragState.startY);
      const { w, h } = panelSizeRef.current;
      setOffset(resolvePosition(rawX, rawY, w, h));
    },
    [resolvePosition],
  );

  const onDragEnd = useCallback(() => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    savePosition(storageKey, offsetRef.current);
    onReturnRequest?.(offsetRef.current.x !== 0 || offsetRef.current.y !== 0);
  }, [onReturnRequest, storageKey]);

  return { offset, dragging, expanded, setExpanded, panelRef, resetPosition, onDragStart, onDragMove, onDragEnd };
}
