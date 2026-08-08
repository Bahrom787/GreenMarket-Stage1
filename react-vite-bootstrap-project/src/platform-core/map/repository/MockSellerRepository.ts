import { asSellerId, type SellerId } from "@/platform-core/contracts/Action";
import { asCategoryId } from "@/platform-core/contracts/DomainTypes";
import type { GeoPoint, MapBounds, SellerMapRecord } from "@/platform-core/map/viewmodels/MapViewModel";
import type { CategoryOption, SellerRepository } from "@/platform-core/map/repository/SellerRepository";
import { GeoService } from "@/platform-core/map/gis/GeoService";
import { defaultMapConfig } from "@/platform-core/map/gis/MapConfig";

/** IMP-003.1 §14: 20-50 продавцов, разные категории, координаты в пределах
 *  тестовой территории, рейтинги, фото (плейсхолдеры — как и в остальном
 *  репозитории, см. PhotoItem#placeholderColor), часы работы. Тестовая
 *  территория — центр Франкфурта-на-Майне (WGS84). Данные детерминированы
 *  (не Math.random()), чтобы dev/тесты были воспроизводимы. */

const CATEGORIES: CategoryOption[] = [
  { categoryId: asCategoryId("vegetables"), name: "Овощи и фрукты" },
  { categoryId: asCategoryId("dairy"), name: "Молочные продукты" },
  { categoryId: asCategoryId("meat"), name: "Мясо и птица" },
  { categoryId: asCategoryId("bakery"), name: "Хлеб и выпечка" },
  { categoryId: asCategoryId("honey"), name: "Мёд и сладости" },
  { categoryId: asCategoryId("fish"), name: "Рыба и морепродукты" },
  { categoryId: asCategoryId("herbs"), name: "Зелень и травы" },
  { categoryId: asCategoryId("nuts"), name: "Орехи и сухофрукты" },
];

const NAMES = [
  "Фермерский дворик", "Зелёная лавка", "Урожай", "Молочный ручей", "Хлебный дом",
  "Медовый край", "Морской улов", "Сад и грядка", "Бабушкин погреб", "Ферма Ивановых",
  "Тёплая грядка", "Пекарня №1", "Сырная лавка", "Дары леса", "Фрукты с юга",
  "Мясной ряд", "Овощная база", "Пряные травы", "Ягодный рай", "Молокозавод",
  "Копчёности", "Ореховый мешок", "Цветочный мёд", "Рыбный двор",
];

const CENTER: GeoPoint = defaultMapConfig.defaultCenter;

function offset(index: number): GeoPoint {
  // Детерминированное псевдослучайное распределение по спирали вокруг центра.
  const angle = index * 2.399963; // золотой угол, даёт равномерный разброс
  const radius = 0.004 + index * 0.0009;
  return {
    lat: CENTER.lat + radius * Math.cos(angle),
    lng: CENTER.lng + radius * Math.sin(angle) * 1.4,
  };
}

function buildSellers(): SellerMapRecord[] {
  return NAMES.map((name, i) => {
    const location = offset(i);
    const categoryIndices = [i % CATEGORIES.length, (i + 3) % CATEGORIES.length];
    const categories = Array.from(new Set(categoryIndices)).map((ci) => CATEGORIES[ci]);
    const isOpenNow = i % 5 !== 0;
    return {
      sellerId: asSellerId(`seller-${i + 1}`),
      name,
      location,
      rating: 3.5 + ((i * 37) % 15) / 10, // 3.5..4.9 детерминированно
      distanceMeters: Math.round(GeoService.distanceMeters(CENTER, location)),
      categories: categories.map((c) => c.categoryId),
      categoryNames: categories.map((c) => c.name),
      photoUrl: null,
      isOpenNow,
      workingHoursLabel: isOpenNow ? "Открыто до 20:00" : "Открывается в 09:00",
      isAvailable: i % 11 !== 0,
    };
  });
}

const ALL_SELLERS = buildSellers();

function isWithinBounds(point: GeoPoint, bounds: MapBounds): boolean {
  return (
    point.lat <= bounds.north &&
    point.lat >= bounds.south &&
    point.lng >= bounds.west &&
    point.lng <= bounds.east
  );
}

const SIMULATED_DELAY_MS = 250;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

export const MockSellerRepository: SellerRepository = {
  getVisibleSellers(bounds) {
    return delay(ALL_SELLERS.filter((s) => isWithinBounds(s.location, bounds)));
  },

  getSeller(id: SellerId) {
    return delay(ALL_SELLERS.find((s) => s.sellerId === id) ?? null);
  },

  getNearbySellers(origin, radiusMeters) {
    return delay(
      ALL_SELLERS.filter((s) => GeoService.distanceMeters(origin, s.location) <= radiusMeters).sort(
        (a, b) => GeoService.distanceMeters(origin, a.location) - GeoService.distanceMeters(origin, b.location),
      ),
    );
  },

  searchSellers(query) {
    const q = query.trim().toLowerCase();
    if (!q) return delay([]);
    return delay(ALL_SELLERS.filter((s) => s.name.toLowerCase().includes(q)));
  },

  findSeller(query) {
    const q = query.trim().toLowerCase();
    if (!q) return delay(null);
    return delay(ALL_SELLERS.find((s) => s.name.toLowerCase().includes(q)) ?? null);
  },

  getCategories() {
    return delay(CATEGORIES);
  },
};
