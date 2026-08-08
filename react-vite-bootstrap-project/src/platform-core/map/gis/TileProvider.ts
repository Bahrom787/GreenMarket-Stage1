/** IMP-003.1 §4: TileProvider — единственное место, где хранится URL тайлов
 *  и attribution. Запрещено хранить эти значения внутри компонентов или
 *  использовать напрямую в JSX — весь код обращается только сюда. */
export interface TileProviderConfig {
  urlTemplate: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  /** Cache Policy — на Stage 1 полагаемся на HTTP-кеш браузера (стандартное
   *  поведение Leaflet TileLayer); отдельный слой кеширования не требуется
   *  по объёму Stage 1, но конфигурация уже централизована для будущего
   *  расширения (например, Service Worker cache) без изменения экрана. */
  crossOrigin: boolean;
}

export const OpenStreetMapTileProvider: TileProviderConfig = {
  urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  minZoom: 3,
  crossOrigin: true,
};
