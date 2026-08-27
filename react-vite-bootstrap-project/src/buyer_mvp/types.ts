// Buyer MVP (Stage 1) — типы Catalog API.
// Контракт product-centric, подтверждён по коду бэкенда (не только по доке):
// товар (Product) — главная сущность, offers[] — предложения продавцов внутри него.
// НЕ путать с platform-core/* — там другая, seller-centric модель (заготовка
// под будущие этапы), к Buyer MVP не относится и не переиспользуется.
//
// price / min_price / stock — строки (backend сериализует Decimal как JSON string,
// чтобы не терять точность). Парсить перед арифметикой, не полагаться на typeof.

export interface ProductGroup {
  id: number;
  parent_id: number | null;
  name: string;
  sort_order: number;
  product_count: number;
}

export interface ProductGroupsResponse {
  groups: ProductGroup[];
}

export interface ProductListItem {
  id: number;
  name: string;
  min_price: string;
  offer_count: number;
  photos: string[];
}

export interface ProductListResponse {
  products: ProductListItem[];
  page: number;
  limit: number;
  total: number;
}

export interface CatalogMarket {
  id: number;
  name: string;
  type: string;
  address: string;
  latitude: string;
  longitude: string;
  seller_count?: number;
}

export interface CatalogMarketsResponse {
  markets: CatalogMarket[];
}

export interface MarketSellerSummary {
  seller_id: number;
  name: string;
  row: string | null;
  place: string | null;
  working_hours: string | null;
  short_description: string | null;
  product_count: number;
}

export interface MarketSellerListResponse {
  sellers: MarketSellerSummary[];
}

export interface BuyerSellerListItem extends MarketSellerSummary {
  market: CatalogMarket;
}

export interface BuyerSellerListResponse {
  sellers: BuyerSellerListItem[];
}

export interface SellerCardResponse {
  seller_id: number;
  name: string;
  market: CatalogMarket | null;
  row: string | null;
  place: string | null;
  working_hours: string | null;
  short_description: string | null;
  phone: string | null;
  whatsapp: string | null;
}

export interface SellerCatalogItem {
  seller_product_id: number;
  product_id: number;
  name: string;
  catalog_name: string;
  group_id: number;
  group_name: string;
  price: string;
  unit: string;
  stock?: string | null;
  description: string | null;
  origin_country: string | null;
  supply_date: string | null;
  photos: string[];
}

export interface SellerCatalogResponse {
  products: SellerCatalogItem[];
  page: number;
  limit: number;
  total: number;
}

export interface SellerOffer {
  seller_product_id: number;
  seller_id: number;
  seller_name: string;
  price: string;
  unit: string;
  stock?: string | null;
  description: string | null;
  photos: string[];
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string | null;
  offers: SellerOffer[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
}

export type SortOrder = 'name' | 'price';

export interface CatalogQuery {
  groupIds?: number[];
  sellerIds?: number[];
  search?: string;
  sort?: SortOrder;
  page?: number;
  limit?: number;
}
