import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { MapAdapterProps } from "@/platform-core/map/gis/MapAdapterTypes";
import { defaultMapConfig } from "@/platform-core/map/gis/MapConfig";
import "leaflet/dist/leaflet.css";

/** IMP-003.1 §3/§4: единственный файл во всём репозитории, которому
 *  разрешено импортировать "leaflet"/"react-leaflet" напрямую. MapScreen
 *  (см. map/gis/MapAdapter.tsx) и остальной экран об этом файле не знают.
 *
 *  IMP-003.1.1 §1: Pan, колесо мыши, двойной клик и ограничение масштаба —
 *  штатное поведение react-leaflet MapContainer; здесь они не отключаются
 *  (дефолты dragging/doubleClickZoom = true) и explicit-конфигурируются
 *  через MapConfig, а не магическими значениями в компоненте. */

function sellerDivIcon(selected: boolean, available: boolean, sellerId: string): L.DivIcon {
  const bg = !available ? "var(--color-disabled-content)" : selected ? "var(--color-brand-accent)" : "var(--color-brand-primary)";
  return L.divIcon({
    className: "gm-map-marker",
    html: `<span data-testid="seller-marker" data-seller-id="${sellerId}" style="display:block;width:${selected ? 20 : 14}px;height:${selected ? 20 : 14}px;border-radius:999px;background:${bg};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></span>`,
    iconSize: [selected ? 24 : 18, selected ? 24 : 18],
    iconAnchor: [selected ? 12 : 9, selected ? 12 : 9],
  });
}

function MapEventsBridge({
  onCameraChange,
  onVisibleBoundsChange,
  onMapLoaded,
  onMapBackgroundClick,
}: Pick<MapAdapterProps, "onCameraChange" | "onVisibleBoundsChange" | "onMapLoaded" | "onMapBackgroundClick">) {
  const reportBounds = (leafletMap: L.Map) => {
    const b = leafletMap.getBounds();
    onVisibleBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  };

  const map = useMapEvents({
    load: () => onMapLoaded(),
    // IMP-003.1.1 §2: MoveMap и ZoomMap — раздельные Runtime-события, а не
    // один общий эффект на любое изменение камеры (Pan не должен выглядеть
    // как ZoomMap и наоборот).
    moveend: () => {
      const c = map.getCenter();
      onCameraChange({ center: { lat: c.lat, lng: c.lng }, zoom: map.getZoom() }, "move");
      reportBounds(map);
    },
    zoomend: () => {
      const c = map.getCenter();
      onCameraChange({ center: { lat: c.lat, lng: c.lng }, zoom: map.getZoom() }, "zoom");
      reportBounds(map);
    },
    click: () => onMapBackgroundClick(),
  });
  // react-leaflet's `load` event doesn't always fire post-mount reliably across versions —
  // fire once on mount as a safety net (IMP-003.1 §9: MAP_LOADED must be dispatched;
  // IMP-003.1.2 §3: initial bounds must reach the Repository before any pan/zoom).
  const firedRef = useRef(false);
  useEffect(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      onMapLoaded();
      reportBounds(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- намеренно один раз при монтировании
  }, [onMapLoaded]);
  return null;
}

function CenterRequestBridge({ token, camera }: { token: number; camera: MapAdapterProps["camera"] }) {
  const map = useMap();
  const lastToken = useRef(token);
  useEffect(() => {
    if (token !== lastToken.current) {
      lastToken.current = token;
      map.flyTo([camera.center.lat, camera.center.lng], camera.zoom, { duration: 0.6 });
    }
  }, [token, camera, map]);
  return null;
}

export function LeafletAdapter({
  sellers,
  selectedSellerId,
  userLocation,
  camera,
  onMapLoaded,
  onCameraChange,
  onVisibleBoundsChange,
  onSellerSelect,
  onMapBackgroundClick,
  centerRequestToken,
}: MapAdapterProps) {
  return (
    // data-testid on a wrapper div (rather than on MapContainer itself, whose typed
    // props don't include arbitrary data-* attributes) — IMP-003.1 §3: this remains
    // the only file that touches "leaflet"/"react-leaflet" directly.
    <div data-testid="leaflet-map" style={{ width: "100%", height: "100%" }}>
      <MapContainer
        center={[camera.center.lat, camera.center.lng]}
        zoom={camera.zoom}
        minZoom={defaultMapConfig.minZoom}
        maxZoom={defaultMapConfig.maxZoom}
        scrollWheelZoom={defaultMapConfig.enableScrollWheelZoom}
        doubleClickZoom={defaultMapConfig.enableDoubleClickZoom}
        dragging
        touchZoom
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer url={defaultMapConfig.tileProvider.urlTemplate} attribution={defaultMapConfig.tileProvider.attribution} />
        <MapEventsBridge
          onCameraChange={onCameraChange}
          onVisibleBoundsChange={onVisibleBoundsChange}
          onMapLoaded={onMapLoaded}
          onMapBackgroundClick={onMapBackgroundClick}
        />
        <CenterRequestBridge token={centerRequestToken} camera={camera} />

        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2E6C8E", fillOpacity: 1 }}
          />
        )}

        {sellers.map((seller) => (
          <Marker
            key={seller.sellerId}
            position={[seller.location.lat, seller.location.lng]}
            icon={sellerDivIcon(seller.sellerId === selectedSellerId, seller.isAvailable, seller.sellerId)}
            eventHandlers={{ click: () => onSellerSelect(seller.sellerId) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
