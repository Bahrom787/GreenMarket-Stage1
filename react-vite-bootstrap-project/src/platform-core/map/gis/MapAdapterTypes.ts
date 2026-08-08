import type { SellerId } from "@/platform-core/contracts/Action";
import type { CameraParams, GeoPoint, MapBounds, SellerMapRecord } from "@/platform-core/map/viewmodels/MapViewModel";

export type CameraChangeReason = "move" | "zoom";

/** IMP-003.1 §3 / IMP-003.1.1 §2 / IMP-003.1.2 §3: контракт MapAdapter.
 *  MapScreen знает только этот файл — ни один тип Leaflet/react-leaflet
 *  сюда не просачивается. Замена картографического движка = замена
 *  реализации ниже этого контракта, без изменения экрана.
 *
 *  `reason` в onCameraChange позволяет экрану диспатчить раздельные
 *  MoveMap/ZoomMap Runtime-события. `onVisibleBoundsChange` передаёт
 *  РЕАЛЬНЫЕ границы видимой области (не приближение через радиус) — экран
 *  запрашивает Repository именно по ним (IMP-003.1.2 §3 "Использовать
 *  текущие границы карты"). */
export interface MapAdapterProps {
  sellers: SellerMapRecord[];
  selectedSellerId: SellerId | null;
  userLocation: GeoPoint | null;
  camera: CameraParams;
  onMapLoaded: () => void;
  onCameraChange: (camera: CameraParams, reason: CameraChangeReason) => void;
  onVisibleBoundsChange: (bounds: MapBounds) => void;
  onSellerSelect: (sellerId: SellerId) => void;
  onMapBackgroundClick: () => void;
  /** Императивный доступ для FAB "центрировать карту" — не завязан на
   *  конкретный движок: реализация решает, что значит "центрировать". */
  centerRequestToken: number;
}
