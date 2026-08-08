import type { SellerId, ProductId } from "../../contracts/Action";
import type { PhotoItem, AvailableAction } from "../../contracts/ContentBlock";
import type { ViewState } from "../../contracts/ViewState";
import type { RatingVm } from "../../presentation/RatingVm";

/** FavoritesId — локальный branded-тип, как BasketId: пока ни в одном
 *  Action payload не участвует (REMOVE_FROM_FAVORITES/REFRESH_FAVORITES
 *  спроектированы без него — REMOVE по sellerId+productId, REFRESH без
 *  payload вообще, единый "текущий" список избранного). */
export type FavoritesId = string & { readonly __brand: "FavoritesId" };
export const asFavoritesId = (id: string): FavoritesId => id as FavoritesId;

/** ТЗ-038 §6: элемент избранного. Никаких вычислений внутри модели. */
export interface FavoriteItem {
  productId: ProductId;
  sellerId: SellerId;
  name: string;
  photo: PhotoItem | null;
  currentPrice: number;
  previousPrice: number | null;
  availability: "available" | "replacement" | "missing";
  rating: RatingVm;
  unit: string;
  isFavorite: boolean;
}

/** Доменный контракт экрана «Избранное» (ТЗ-038 §5). Ничего не знает про
 *  рендеринг. state — общий ViewState. */
export interface FavoritesViewModel {
  favoritesId: FavoritesId;
  items: FavoriteItem[];
  totalItems: number;
  state: ViewState;
  availableActions: AvailableAction[];
}
