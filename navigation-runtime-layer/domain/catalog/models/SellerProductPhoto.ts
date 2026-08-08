import type { SellerId, ProductId } from "../../../contracts/Action";

/** Дополнение к GM-DOM-001 §5 — в текущей редакции документа не
 *  специфицировано отдельной сущностью, но требуется на практике: у
 *  Seller Card уже есть поле `photos` (см. мок-данные SellerCardViewModel
 *  в BottomSheetDeclarative.tsx, `photos: []`) и `PhotoItem` в
 *  contracts/ContentBlock.ts — но оба уровня presentation, ни один не
 *  описывает домен.
 *
 *  Отличие от `Product.photoUrl` (GM-DOM-001 §5.2): `Product.photoUrl` —
 *  один общий, "каталожный" снимок товара-справочника, одинаковый для всех
 *  продавцов, которые его продают. `SellerProductPhoto` — конкретное фото,
 *  которое загрузил определённый продавец для своего предложения
 *  (SellerProduct): подтверждение свежести, реального вида товара на
 *  прилавке и т.п. У одного SellerProduct таких фото может быть несколько
 *  или ноль; наличие/число фото — часть доверия к продавцу (см. `trustLevel`
 *  у SellerCardViewModel), поэтому вынесено отдельной сущностью, а не полем
 *  внутри SellerProduct. */
export interface SellerProductPhoto {
  readonly id: string;
  readonly sellerId: SellerId;
  readonly productId: ProductId;
  readonly url: string;
  /** ISO 8601. Используется для маркировки "устаревших" фото — та же идея,
   *  что `lastConfirmedAt`/`dataMayBeStale` у SellerCardViewModel. */
  readonly uploadedAt: string;
  /** "seller" — загружено самим продавцом; "buyer_report" — приложено
   *  покупателем к репорту (см. RowItem.tag "missing"/REPORT_MISSING_PRODUCT
   *  в contracts/Action.ts) — разный уровень доверия к источнику снимка. */
  readonly source: "seller" | "buyer_report";
}
