import assert from "node:assert/strict";
import { MockSellerRepository } from "../MockSellerRepository";

/** Формат — как в MockSellerProductPhotoRepository.test.ts: node:assert, без test runner'а.
 *  Запуск: npx tsx src/platform-core/map/repository/__tests__/MockSellerRepository.test.ts */

async function run() {
  const all = await MockSellerRepository.getAllSellers();

  assert.ok(all.length >= 20, "getAllSellers: каталог содержит не менее 20 продавцов (IMP-003.1 §14)");
  assert.ok(all.length <= 50, "getAllSellers: каталог не превышает 50 продавцов (IMP-003.1 §14)");

  const ids = new Set(all.map((s) => s.sellerId));
  assert.equal(ids.size, all.length, "getAllSellers: sellerId уникальны");

  assert.ok(all.every((s) => s.name.length > 0), "getAllSellers: у каждого продавца есть название");
  assert.ok(all.every((s) => s.categories.length > 0), "getAllSellers: у каждого продавца есть категории");
  assert.ok(all.every((s) => s.rating >= 3.5 && s.rating <= 4.9), "getAllSellers: рейтинги в пределах 3.5..4.9");

  const onlyVisible = await MockSellerRepository.getVisibleSellers({
    north: all[0].location.lat + 0.0001,
    south: all[0].location.lat - 0.0001,
    east: all[0].location.lng + 0.0001,
    west: all[0].location.lng - 0.0001,
  });
  assert.ok(
    onlyVisible.length < all.length,
    "getAllSellers: отдаёт полный каталог, а не только видимую на карте область"
  );

  // Поиск по названию: «ё» и «е» считаются одинаковыми (нормализация).
  const medoviy = await MockSellerRepository.searchSellers("мёдовый");
  assert.ok(
    medoviy.some((s) => s.name === "Медовый край"),
    "searchSellers: «ё» в запросе находит «е» в названии продавца"
  );

  const honey = await MockSellerRepository.searchSellers("медовый");
  assert.ok(
    honey.some((s) => s.name === "Медовый край"),
    "searchSellers: поиск находит по подстроке названия"
  );

  const found = await MockSellerRepository.findSeller("мёдовый");
  assert.equal(found?.name, "Медовый край", "findSeller: «ё» в запросе находит «е» в названии продавца");

  // «Поиск продавцов»: результат в радиусе от точки поиска, отсортирован по
  // расстоянию и содержит реальное distanceMeters от точки (не от центра
  // территории). Сортировка по ключу "distance" — как из мастера на карте.
  const origin = all[0].location;
  const atOrigin = await MockSellerRepository.searchSellersNear({
    origin,
    radiusMeters: 10,
    sort: { key: "distance" },
  });
  assert.equal(atOrigin.length, 1, "searchSellersNear: в радиусе 10 м — только продавец в точке поиска");
  assert.equal(atOrigin[0].sellerId, all[0].sellerId, "searchSellersNear: ближайший — сам продавец в точке");
  assert.equal(atOrigin[0].distanceMeters, 0, "searchSellersNear: distanceMeters пересчитан от точки поиска");

  const wide = await MockSellerRepository.searchSellersNear({
    origin,
    radiusMeters: 10000,
    sort: { key: "distance" },
  });
  assert.ok(wide.length > 1, "searchSellersNear: в радиусе 10 км — несколько продавцов");
  assert.ok(
    wide.every((s, i) => i === 0 || wide[i - 1].distanceMeters <= s.distanceMeters),
    "searchSellersNear: отсортированы по расстоянию по возрастанию"
  );
  assert.ok(wide.every((s) => s.distanceMeters <= 10000), "searchSellersNear: все продавцы в радиусе поиска");

  console.log("MockSellerRepository: все проверки пройдены");
}

run();
