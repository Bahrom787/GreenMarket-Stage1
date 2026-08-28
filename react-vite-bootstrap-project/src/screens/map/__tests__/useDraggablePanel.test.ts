import assert from 'node:assert/strict';
import { it } from 'vitest';
import { loadStoredOffset, rectsOverlap, resolvePanelOffset, type PanelLayout } from '../useDraggablePanel';

const layout: PanelLayout = {
  anchor: 'bottom-right',
  mapRect: { left: 0, top: 0, right: 400, bottom: 800, width: 400, height: 800 },
  fullWidth: 80,
  fullHeight: 120,
  bodyWidth: 64,
  bodyHeight: 104,
};

it('returns null for malformed stored offsets', () => {
  assert.equal(loadStoredOffset('missing-key'), null);
});

it('detects rectangle overlap', () => {
  assert.equal(rectsOverlap({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 9, top: 9, right: 20, bottom: 20 }), true);
  assert.equal(rectsOverlap({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 10, top: 10, right: 20, bottom: 20 }), false);
});

it('clamps panel offset to map bounds', () => {
  const resolved = resolvePanelOffset(999, -999, layout);
  const baseLeft = layout.mapRect.right - 16 - layout.fullWidth;
  const baseTop = layout.mapRect.bottom - 32 - layout.fullHeight;
  const panelRect = {
    left: baseLeft + resolved.x,
    top: baseTop + resolved.y,
    right: baseLeft + layout.fullWidth + resolved.x,
    bottom: baseTop + layout.fullHeight + resolved.y,
  };
  assert.ok(panelRect.left >= layout.mapRect.left + 8);
  assert.ok(panelRect.top >= layout.mapRect.top + 8);
  assert.ok(panelRect.right <= layout.mapRect.right - 8);
  assert.ok(panelRect.bottom <= layout.mapRect.bottom - 16);
});

it('keeps downward drag inside the safe bottom boundary', () => {
  const resolved = resolvePanelOffset(0, 999, layout);
  const baseTop = layout.mapRect.bottom - 32 - layout.fullHeight;
  assert.equal(baseTop + layout.fullHeight + resolved.y, layout.mapRect.bottom - 16);
});

it('pushes panel away from overlapping obstacle', () => {
  const obstacle = { left: 300, top: 640, right: 390, bottom: 770 };
  const resolved = resolvePanelOffset(0, 0, layout, [obstacle]);
  const baseLeft = layout.mapRect.right - 16 - layout.fullWidth;
  const baseTop = layout.mapRect.bottom - 32 - layout.fullHeight;
  const panelRect = {
    left: baseLeft + resolved.x,
    top: baseTop + resolved.y,
    right: baseLeft + layout.fullWidth + resolved.x,
    bottom: baseTop + layout.fullHeight + resolved.y,
  };
  assert.equal(rectsOverlap(panelRect, obstacle), false);
});
