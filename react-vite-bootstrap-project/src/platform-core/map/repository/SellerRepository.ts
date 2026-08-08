import type { SellerId } from "@/platform-core/contracts/Action";
import type { CategoryId } from "@/platform-core/contracts/DomainTypes";
import type { GeoPoint, MapBounds, SellerMapRecord } from "@/platform-core/map/viewmodels/MapViewModel";

export interface CategoryOption {
  categoryId: CategoryId;
  name: string;
}

/** IMP-003.1 §13: минимальный контракт Repository для экрана Map. Экран и
 *  ViewModel обращаются только к этому интерфейсу — реализация (сегодня
 *  MockSellerRepository, завтра — HTTP-клиент к Backend) может замениться
 *  без изменения экрана. */
export interface SellerRepository {
  getVisibleSellers(bounds: MapBounds): Promise<SellerMapRecord[]>;
  getSeller(id: SellerId): Promise<SellerMapRecord | null>;
  getNearbySellers(origin: GeoPoint, radiusMeters: number): Promise<SellerMapRecord[]>;
  searchSellers(query: string): Promise<SellerMapRecord[]>;
  /** IMP-003.1.2 §11: единичный лучший результат по названию — то, что
   *  строка поиска (§6) центрирует карту и открывает Bottom Sheet на одном
   *  продавце. searchSellers() остаётся для случаев, когда нужен весь
   *  список совпадений. */
  findSeller(query: string): Promise<SellerMapRecord | null>;
  getCategories(): Promise<CategoryOption[]>;
}
