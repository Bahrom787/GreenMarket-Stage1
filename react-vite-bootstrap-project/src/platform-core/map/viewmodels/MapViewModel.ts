import type { SellerId } from "@/platform-core/contracts/Action";
import type { CategoryId } from "@/platform-core/contracts/DomainTypes";
import type { ViewState } from "@/platform-core/contracts/ViewState";

/** Географическая точка WGS84 (EPSG:4326) — см. IMP-003.1 §2 "Координаты". */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Продавец на карте — доменная запись Map (IMP-003.1 §15 "Маркеры продавцов").
 *  Не путать с SellerCardViewModel#seller (там уже отформатированные строки
 *  distance и т.п.) — здесь сырые данные, форматирование делает MapSheetAdapter. */
export interface SellerMapRecord {
  sellerId: SellerId;
  name: string;
  location: GeoPoint;
  rating: number;
  distanceMeters: number;
  categories: CategoryId[];
  categoryNames: string[];
  photoUrl: string | null;
  isOpenNow: boolean;
  workingHoursLabel: string;
  isAvailable: boolean;
}

export interface CameraParams {
  center: GeoPoint;
  zoom: number;
}

export type BottomSheetState = "hidden" | "sellerSummary";

/** Доменный контракт экрана Map (IMP-003.1 §10 "ViewModel"). Ничего не знает
 *  про Leaflet/react-leaflet — та часть инкапсулирована в map/gis/. */
export interface MapViewModel {
  state: ViewState;
  sellers: SellerMapRecord[];
  selectedSellerId: SellerId | null;
  userLocation: GeoPoint | null;
  camera: CameraParams;
  bottomSheet: BottomSheetState;
  currentAreaLabel: string | null;
}
