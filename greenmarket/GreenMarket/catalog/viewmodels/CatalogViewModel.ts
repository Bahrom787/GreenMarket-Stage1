import type { SellerId, ProductId } from "../../contracts/Action";
import type { PhotoItem, AvailableAction } from "../../contracts/ContentBlock";
import type { ViewState } from "../../contracts/ViewState";
import type { CategoryId } from "../../contracts/DomainTypes";
import type { PriceVm } from "../../presentation/PriceVm";
import type { RatingVm } from "../../presentation/RatingVm";

export interface CategoryRecord {
  categoryId: CategoryId;
  name: string;
  productCount: number;
  isSelected: boolean;
}

/** ТЗ-036 §6: товар каталога — более богатая запись, чем общий
 *  contracts/DomainTypes.ts#ProductRecord (там только id/name/price/unit/
 *  availability — этого достаточно для SellerCard, но не хватает Photo/
 *  PreviousPrice/Rating/ShortDescription). Не расширяю общий ProductRecord
 *  (использовался бы SellerCard'ом, не должен раздуваться под нужды одного
 *  экрана) и не дублирую его один в один — это самостоятельная запись,
 *  локальная для catalog/, пока не доказано, что она нужна где-то ещё. */
export interface CatalogProductRecord {
  productId: ProductId;
  name: string;
  photo: PhotoItem | null;
  price: PriceVm;
  availability: "available" | "replacement" | "missing";
  rating: RatingVm;
  unit: string;
  shortDescription: string;
}

/** Доменный контракт экрана «Каталог» (ТЗ-036 §5). Ничего не знает про
 *  рендеринг. state — общий ViewState (не создавался собственный, как и
 *  требует §15). */
export interface CatalogViewModel {
  sellerId: SellerId;
  sellerName: string;
  catalogTitle: string;
  categories: CategoryRecord[];
  selectedCategory: CategoryId | null;
  productList: CatalogProductRecord[];
  totalProducts: number;
  state: ViewState;
  availableActions: AvailableAction[];
}
