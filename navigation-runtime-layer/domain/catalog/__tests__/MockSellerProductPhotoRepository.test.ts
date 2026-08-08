import assert from "node:assert/strict";
import { asSellerId, asProductId } from "../../../contracts/Action";
import { MockSellerProductPhotoRepository } from "../MockSellerProductPhotoRepository";

/** Формат — как в MockCatalogRepository.test.ts: node:assert, без test runner'а.
 *  Запуск: npx tsx domain/catalog/__tests__/MockSellerProductPhotoRepository.test.ts */

async function run() {
  const photos = await MockSellerProductPhotoRepository.getPhotos(asSellerId("seller-1"), asProductId("product-1"));
  assert.ok(photos.length > 0, "getPhotos: должен вернуть фото существующего предложения продавца");
  assert.ok(
    photos.every((p) => p.sellerId === asSellerId("seller-1") && p.productId === asProductId("product-1")),
    "getPhotos: не должен возвращать фото чужого продавца или другого товара"
  );

  const noPhotos = await MockSellerProductPhotoRepository.getPhotos(asSellerId("seller-2"), asProductId("product-1"));
  assert.equal(noPhotos.length, 0, "getPhotos: для пары без фото — пустой список, а не исключение");

  const bySeller = await MockSellerProductPhotoRepository.getPhotosBySeller(asSellerId("seller-1"));
  assert.ok(bySeller.length >= photos.length, "getPhotosBySeller: должен включать фото по всем товарам продавца");
  assert.ok(
    bySeller.every((p) => p.sellerId === asSellerId("seller-1")),
    "getPhotosBySeller: не должен возвращать фото чужого продавца"
  );

  const sources = new Set(bySeller.map((p) => p.source));
  assert.ok(
    [...sources].every((s) => s === "seller" || s === "buyer_report"),
    "source: значение должно быть одним из двух допустимых"
  );

  console.log("MockSellerProductPhotoRepository: все проверки пройдены");
}

run();
