import assert from 'node:assert/strict';
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
