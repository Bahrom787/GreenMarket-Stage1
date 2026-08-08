import assert from "node:assert/strict";
import { asSellerId, asProductId } from "../../../contracts/Action";
import { asCategoryId } from "../../../contracts/DomainTypes";
import { MockCatalogRepository } from "../MockCatalogRepository";
import { MockSellerProductPhotoRepository } from "../MockSellerProductPhotoRepository";

/** В отличие от MockCatalogRepository.test.ts (сценарии использования
 *  Repository — "поиск находит то, что нужно") этот файл проверяет форму
 *  самих Domain Models (GM-DOM-001 §5) — что каждая модель содержит
 *  обязательные поля правильного типа и что связанные модели (Seller ↔
 *  SellerProduct ↔ Product ↔ CatalogPublication ↔ SellerProductPhoto)
 *  согласованы друг с другом по id. Формат — тот же: node:assert, без test
 *  runner'а. Запуск: npx tsx domain/catalog/__tests__/DomainModels.test.ts */

async function run() {
  // Seller (GM-DOM-001 §5.1)
  const seller = await MockCatalogRepository.getSeller(asSellerId("seller-1"));
  assert.ok(seller, "Seller: существующий id должен находиться");
  assert.equal(typeof seller!.name, "string", "Seller.name: обязательное строковое поле");
  assert.ok(seller!.rating === null || typeof seller!.rating === "number", "Seller.rating: number | null");
  assert.ok(seller!.status === "published" || seller!.status === "unpublished", "Seller.status: одно из двух допустимых значений");

  // ProductGroup (GM-DOM-001 §5.5)
  const categories = await MockCatalogRepository.getCategories();
  assert.ok(categories.length > 0, "ProductGroup: справочник категорий не должен быть пустым");
  for (const group of categories) {
    assert.equal(typeof group.id, "string", "ProductGroup.id: CategoryId — branded string");
    assert.equal(typeof group.name, "string", "ProductGroup.name: обязательное строковое поле");
  }

  // CatalogPublication (GM-DOM-001 §5.4) — согласованность полей-проекций
  const publications = await MockCatalogRepository.getPublishedCatalog();
  assert.ok(publications.length > 0, "CatalogPublication: непустой опубликованный каталог");
  for (const pub of publications) {
    assert.ok(pub.availability === "available" || pub.availability === "replacement" || pub.availability === "missing", "CatalogPublication.availability: одно из трёх допустимых значений");
    assert.ok(pub.price >= 0, "CatalogPublication.price: не должна быть отрицательной");
    const categoryExists = categories.some((c) => c.id === pub.categoryId);
    assert.ok(categoryExists, "CatalogPublication.categoryId: должен ссылаться на существующую ProductGroup");
  }

  // SellerProduct (GM-DOM-001 §5.3) — каждое предложение ссылается на существующего Seller/Product
  const sellerCatalog = await MockCatalogRepository.getSellerCatalog(asSellerId("seller-1"));
  for (const sp of sellerCatalog) {
    const product = await MockCatalogRepository.getProduct(sp.productId);
    assert.ok(product, "SellerProduct.productId: должен ссылаться на существующий Product");
    assert.equal(typeof sp.published, "boolean", "SellerProduct.published: обязательное boolean поле");
  }

  // SellerProductPhoto — согласованность с SellerProduct: фото не должно существовать для пары, которой нет в каталоге продавца
  const photos = await MockSellerProductPhotoRepository.getPhotos(asSellerId("seller-1"), asProductId("product-1"));
  const hasOffer = sellerCatalog.some((sp) => sp.productId === asProductId("product-1"));
  assert.ok(hasOffer, "SellerProductPhoto: тестовые фото ссылаются на пару, реально присутствующую в SellerProduct");
  for (const photo of photos) {
    assert.equal(photo.sellerId, asSellerId("seller-1"), "SellerProductPhoto.sellerId: соответствует запрошенному продавцу");
    assert.ok(photo.source === "seller" || photo.source === "buyer_report", "SellerProductPhoto.source: одно из двух допустимых значений");
    assert.ok(!Number.isNaN(Date.parse(photo.uploadedAt)), "SellerProductPhoto.uploadedAt: должна быть валидной ISO-датой");
  }

  // Категория без единой публикации (GM-DOM-001 §5.5) — модель допускает пустой результат, это не ошибка
  const emptyCategory = await MockCatalogRepository.getCatalogByCategory(asCategoryId("meat"));
  assert.ok(Array.isArray(emptyCategory), "getCatalogByCategory: для категории без публикаций возвращает пустой массив, а не исключение");

  console.log("DomainModels: все проверки пройдены");
}

run();
