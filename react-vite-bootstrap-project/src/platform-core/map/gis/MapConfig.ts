import { OpenStreetMapTileProvider, type TileProviderConfig } from "@/platform-core/map/gis/TileProvider";
import type { GeoPoint } from "@/platform-core/map/viewmodels/MapViewModel";

/** Централизованная конфигурация карты (рекомендация ревью к IMP-003.1.1,
 *  п.2 "MapConfig"). Значения, которые иначе расползлись бы по компонентам
 *  (LeafletAdapter, MapScreenView) — минимум изменится при появлении
 *  реальных пользовательских настроек (например, пользовательской позиции
 *  по умолчанию), т.к. вся карта читает их только отсюда. */
export interface MapConfig {
  defaultCenter: GeoPoint;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  tileProvider: TileProviderConfig;
  enableUserLocation: boolean;
  enableScrollWheelZoom: boolean;
  enableDoubleClickZoom: boolean;
  /** Радиус (в метрах) области, для которой MapScreenView запрашивает
   *  продавцов у Repository при заданном центре камеры. */
  visibleAreaRadiusMeters: number;
}

export const defaultMapConfig: MapConfig = {
  defaultCenter: { lat: 50.1109, lng: 8.6821 }, // Frankfurt am Main — тестовая территория
  defaultZoom: 13,
  minZoom: OpenStreetMapTileProvider.minZoom,
  maxZoom: OpenStreetMapTileProvider.maxZoom,
  tileProvider: OpenStreetMapTileProvider,
  enableUserLocation: true,
  enableScrollWheelZoom: true,
  enableDoubleClickZoom: true,
  visibleAreaRadiusMeters: 6000,
};
