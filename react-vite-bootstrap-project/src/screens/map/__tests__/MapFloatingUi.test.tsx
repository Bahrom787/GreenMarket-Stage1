import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { it } from 'vitest';
import { MAP_FAB_TOOLTIP_DELAY_MS, MapFabButton } from '../MapFabButton';
import { MapFabPanel } from '../MapFabPanel';
import { MapLegend } from '../MapLegend';

it('keeps faster fab tooltip delay', () => {
  assert.equal(MAP_FAB_TOOLTIP_DELAY_MS, 400);
});

it('renders panel, legend and fab button accessibility hooks', () => {
  const panelHtml = renderToStaticMarkup(
    <MapFabPanel>
      <MapFabButton label="Открыть каталог" icon="🛒" onClick={() => undefined} />
    </MapFabPanel>,
  );
  assert.match(panelHtml, /fab-panel/);
  assert.match(panelHtml, /fab-panel-toggle/);
  assert.match(panelHtml, /aria-label="Открыть панель инструментов"/);

  const legendHtml = renderToStaticMarkup(<MapLegend />);
  assert.match(legendHtml, /map-legend/);
  assert.match(legendHtml, /legend-toggle/);
  assert.match(legendHtml, /aria-label="Развернуть легенду"/);

  const buttonHtml = renderToStaticMarkup(<MapFabButton label="Поиск продавцов" icon="🧭" onClick={() => undefined} />);
  assert.match(buttonHtml, /aria-label="Поиск продавцов"/);
});

it('keeps map controls separate from the shared app header', () => {
  const view = readFileSync(join(process.cwd(), 'src/screens/map/MapScreenView.tsx'), 'utf8');
  const css = readFileSync(join(process.cwd(), 'src/screens/map/map.css'), 'utf8');
  assert.match(view, /className="gm-map-controls"/);
  assert.match(view, /className="gm-map-search-slot"/);
  assert.doesNotMatch(view, /gm-map-header__brand/);
  assert.doesNotMatch(view, /🌿 Green Board/);
  assert.doesNotMatch(css, /\.gm-map-search-slot\s*{[^}]*position:\s*absolute/s);
  assert.match(css, /\.gm-map-search\s*{[^}]*display:\s*flex/s);
});

it('keeps readable search mode labels', () => {
  const view = readFileSync(join(process.cwd(), 'src/screens/map/MapScreenView.tsx'), 'utf8');
  assert.match(view, /Режим поиска на карте/);
  assert.match(view, /Продавцы/);
  assert.match(view, /Товары/);
  assert.doesNotMatch(view, /Рџ|Рў|Р РµР¶РёРј/);
});

it('keeps Leaflet attribution overlay hidden on Map Screen', () => {
  const leaflet = readFileSync(join(process.cwd(), 'src/platform-core/map/gis/LeafletAdapter.tsx'), 'utf8');
  assert.match(leaflet, /attributionControl=\{false\}/);
  assert.doesNotMatch(leaflet, /attribution=\{tileProvider\.attribution\}/);
});

it('keeps restored working map tools in the floating panel', () => {
  const view = readFileSync(join(process.cwd(), 'src/screens/map/MapScreenView.tsx'), 'utf8');
  for (const testId of ['toggle-map-pois', 'open-catalog', 'open-seller-search', 'center-on-user', 'toggle-fullscreen', 'toggle-theme']) {
    assert.match(view, new RegExp(`testId="${testId}"`));
  }
});
