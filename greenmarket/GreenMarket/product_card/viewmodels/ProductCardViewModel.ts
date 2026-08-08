import type { ProductId, SellerId } from "../../contracts/Action";
import type { PhotoItem, AvailableAction } from "../../contracts/ContentBlock";
import type { LoadState } from "../../contracts/LoadState";
import type { PriceVm } from "../../presentation/PriceVm";
import type { RatingVm } from "../../presentation/RatingVm";

export interface ProductCardViewModel {
  productId: ProductId;
  name: string;
  photos: PhotoItem[];
  price: PriceVm;
  availability: "available" | "replacement" | "missing";
  seller: { sellerId: SellerId; name: string };
  freshness: string;
  rating: RatingVm;
  description: string;
  availableActions: AvailableAction[];
  loadState: LoadState;
}
