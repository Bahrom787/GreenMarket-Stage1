import type { ContentBlock } from "../../contracts/ContentBlock";
import type { ProductCardViewModel } from "../viewmodels/ProductCardViewModel";
import { PriceFormatter } from "../../formatting/PriceFormatter";
import { RatingFormatter } from "../../formatting/RatingFormatter";

/** ProductCardViewModel → ProductCardAdapter → ContentBlock[] → BottomSheetRenderer.
 *  Форматирование PresentationModel → string выполняется здесь через общие
 *  Formatter'ы (formatting/), сам Adapter вычислений/решений не делает. */
export const ProductCardAdapter = {
  toBlocks(vm: ProductCardViewModel): ContentBlock[] {
    if (vm.loadState === "loading") return [{ type: "skeleton" }];
    if (vm.loadState === "error") return [{ type: "empty", text: "Не удалось загрузить карточку товара." }];

    const blocks: ContentBlock[] = [];
    if (vm.photos.length) blocks.push({ type: "photoStrip", items: vm.photos });
    blocks.push({ type: "sectionLabel", text: vm.name });
    blocks.push({ type: "priceLine", text: PriceFormatter.format(vm.price) });
    if (vm.availability !== "available") {
      blocks.push({ type: "alerts", items: [vm.availability === "missing" ? "Нет в наличии" : "Возможна замена"] });
    }
    blocks.push({ type: "metaLine", text: `${vm.freshness} · ${RatingFormatter.format(vm.rating)}` });
    blocks.push({
      type: "list",
      items: [{ id: vm.seller.sellerId, avatar: "🏪", title: vm.seller.name, subtitle: "Продавец", action: { type: "OPEN_SELLER", payload: { sellerId: vm.seller.sellerId } } }],
    });
    if (vm.description) blocks.push({ type: "text", text: vm.description });
    return blocks;
  },
};
