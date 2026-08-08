import { useEffect, useRef, useState } from 'react';
import { Icon, IconButton } from '@/design-system/components';
import './map.css';

/** Задержка перед показом подсказки при наведении (MAP-005): исходные
 *  2000 мс сокращены в 3 раза → ~667 мс. */
const TOOLTIP_DELAY_MS = 667;
const TOOLTIP_LABEL = 'Моё местоположение';

export interface MapLocationButtonProps {
  /** Запускает получение геолокации и центрирование карты (MapScreenView). */
  onLocate: () => void;
}

/** FAB "Моё местоположение" для экрана Map (нижний правый угол).
 *  Только отображение кнопки и задержанный tooltip; сама геолокация и
 *  центрирование — в MapScreenView (handleCenterOnUser), чтобы не дублировать
 *  работу с GeoService/MapRuntime в Map UI. */
export function MapLocationButton({ onLocate }: MapLocationButtonProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const showDelayed = () => {
    if (timerRef.current !== null) return;
    timerRef.current = window.setTimeout(() => setTooltipVisible(true), TOOLTIP_DELAY_MS);
  };

  const hide = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTooltipVisible(false);
  };

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="gm-map-location">
      <IconButton
        label={TOOLTIP_LABEL}
        onClick={onLocate}
        onMouseEnter={showDelayed}
        onMouseLeave={hide}
        onFocus={showDelayed}
        onBlur={hide}
        aria-describedby={tooltipVisible ? 'map-location-tooltip' : undefined}
        data-testid="map-location-button"
      >
        <Icon label={TOOLTIP_LABEL}>📍</Icon>
      </IconButton>
      {tooltipVisible && (
        <span id="map-location-tooltip" role="tooltip" className="gm-map-location__tooltip">
          {TOOLTIP_LABEL}
        </span>
      )}
    </div>
  );
}
