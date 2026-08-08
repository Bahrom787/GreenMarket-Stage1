import type { SellerId, ProductId } from "../../contracts/Action";
import type { SellerProductPhoto } from "./models/SellerProductPhoto";

/** Отдельный от CatalogRepository интерфейс (не расширяет и не меняет его) —
 *  по GM-DOM-002 §8: новая возможность добавляется без изменения
 *  существующего контракта и существующих экранов. Экраны, которым фото не
 *  нужны (Catalog, Search, Basket, Favorites, PurchaseOptions), продолжают
 *  использовать только CatalogRepository и не знают об этом интерфейсе. */
export interface SellerProductPhotoRepository {
  /** Фото конкретного предложения продавца, вход — пара (SellerId,
   *  ProductId), т.к. фото привязано к SellerProduct, а не к Product
   *  (см. SellerProductPhoto.ts). */
  getPhotos(sellerId: SellerId, productId: ProductId): Promise<SellerProductPhoto[]>;

  /** Все фото продавца по всем его товарам — используется Seller Card
   *  (галерея `photos` в SellerCardViewModel), где не важна привязка к
   *  конкретному товару. */
  getPhotosBySeller(sellerId: SellerId): Promise<SellerProductPhoto[]>;
}
