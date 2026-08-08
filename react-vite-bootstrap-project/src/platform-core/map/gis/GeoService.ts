import type { GeoPoint, MapBounds } from "@/platform-core/map/viewmodels/MapViewModel";

/** IMP-003.1 §5: единый GeoService. Экран Map не обращается напрямую ни к
 *  navigator.geolocation, ни к API Leaflet — только к этому модулю.
 *  Геокодирование — через Nominatim (см. NOMINATIM_BASE_URL); в Stage 1
 *  используется по необходимости (например, для будущей строки поиска
 *  адреса), сам экран Map Stage 1 её не требует напрямую. */

const EARTH_RADIUS_METERS = 6_371_000;
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface GeocodeResult {
  point: GeoPoint;
  displayName: string;
}

export const GeoService = {
  /** Haversine — расстояние по большому кругу между двумя точками WGS84. */
  distanceMeters(a: GeoPoint, b: GeoPoint): number {
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
  },

  /** Границы видимой области по центру и приблизительному масштабу — для
   *  Mock Repository (getVisibleSellers) на этапе, пока карта не отдаёт
   *  реальные границы через MapAdapter#onBoundsChanged. */
  boundsFromCenter(center: GeoPoint, radiusMeters: number): MapBounds {
    const latDelta = radiusMeters / 111_320; // ~метров в одном градусе широты
    const lngDelta = radiusMeters / (111_320 * Math.cos(toRadians(center.lat)));
    return {
      north: center.lat + latDelta,
      south: center.lat - latDelta,
      east: center.lng + lngDelta,
      west: center.lng - lngDelta,
    };
  },

  /** Текущее местоположение пользователя. Единственное место в приложении,
   *  вызывающее navigator.geolocation — экран Map об этом API не знает. */
  getCurrentLocation(): Promise<GeoPoint> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Геолокация недоступна в этом окружении"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
      );
    });
  },

  /** Геокодирование адреса через Nominatim. Сетевой вызов — при недоступности
   *  сети возвращает пустой массив, а не бросает исключение (не блокирует
   *  остальной экран). */
  async geocodeAddress(query: string): Promise<GeocodeResult[]> {
    try {
      const url = `${NOMINATIM_BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) return [];
      const data: Array<{ lat: string; lon: string; display_name: string }> = await response.json();
      return data.map((item) => ({
        point: { lat: Number.parseFloat(item.lat), lng: Number.parseFloat(item.lon) },
        displayName: item.display_name,
      }));
    } catch {
      return [];
    }
  },

  /** Обратное геокодирование координат в название района/города. */
  async reverseGeocode(point: GeoPoint): Promise<string | null> {
    try {
      const url = `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) return null;
      const data: { address?: { suburb?: string; city?: string; town?: string; village?: string } } =
        await response.json();
      return data.address?.suburb ?? data.address?.city ?? data.address?.town ?? data.address?.village ?? null;
    } catch {
      return null;
    }
  },
};
