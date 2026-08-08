import { asSellerId, asProductId, type SellerId, type ProductId } from "../../contracts/Action";
import type { SellerProductPhotoRepository } from "./SellerProductPhotoRepository";
import type { SellerProductPhoto } from "./models/SellerProductPhoto";

/** Временная локальная реализация на тестовых данных — тот же принцип, что
 *  и MockCatalogRepository.ts (GM-DOM-003 §4/§10): заменяется на реальную
 *  реализацию без изменения UI, единственная точка замены — то, что
 *  конструирует репозиторий на стороне экрана. Id продавцов/товаров
 *  намеренно совпадают с MockCatalogRepository.ts, чтобы оба mock-источника
 *  были согласованы друг с другом при совместном использовании на одном
 *  экране (Seller Card). */

const photos: SellerProductPhoto[] = [
  {
    id: "photo-1",
    sellerId: asSellerId("seller-1"),
    productId: asProductId("product-1"),
    url: "https://mock.greenmarket.local/photos/seller-1/product-1/1.jpg",
    uploadedAt: "2026-07-13T08:00:00.000Z",
    source: "seller",
  },
  {
    id: "photo-2",
    sellerId: asSellerId("seller-1"),
    productId: asProductId("product-1"),
    url: "https://mock.greenmarket.local/photos/seller-1/product-1/2.jpg",
    uploadedAt: "2026-07-18T08:00:00.000Z",
    source: "seller",
  },
  {
    id: "photo-3",
    sellerId: asSellerId("seller-2"),
    productId: asProductId("product-3"),
    url: "https://mock.greenmarket.local/photos/seller-2/product-3/1.jpg",
    uploadedAt: "2026-06-01T08:00:00.000Z",
    source: "buyer_report",
  },
];

export const MockSellerProductPhotoRepository: SellerProductPhotoRepository = {
  async getPhotos(sellerId: SellerId, productId: ProductId): Promise<SellerProductPhoto[]> {
    return photos.filter((p) => p.sellerId === sellerId && p.productId === productId);
  },

  async getPhotosBySeller(sellerId: SellerId): Promise<SellerProductPhoto[]> {
    return photos.filter((p) => p.sellerId === sellerId);
  },
};
