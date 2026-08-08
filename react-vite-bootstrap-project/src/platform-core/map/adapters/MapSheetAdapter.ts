import type { ContentBlock } from "@/platform-core/contracts/ContentBlock";
import type { MapViewModel, SellerMapRecord } from "@/platform-core/map/viewmodels/MapViewModel";
import { RatingFormatter } from "@/platform-core/formatting/RatingFormatter";
import { DistanceFormatter } from "@/platform-core/formatting/DistanceFormatter";

/** MapViewModel → MapSheetAdapter → ContentBlock[]. По образцу CatalogAdapter/
 *  SellerCardAdapter: только преобразование модели + форматирование через
 *  общие Formatter'ы, никакой логики.
 *
 *  Важно: этот Adapter отвечает только за содержимое Bottom Sheet (краткая
 *  карточка выбранного продавца, IMP-003.1 §8). Сама область карты — не
 *  ContentBlock, а отдельный канвас, который рендерит map/gis/MapAdapter —
 *  ни один другой экран в этом репозитории не имел карты как часть
 *  контента Bottom Sheet, поэтому распространять ContentBlock на неё было
 *  бы искусственным усложнением существующего контракта. */
function sellerSummaryBlocks(seller: SellerMapRecord): ContentBlock[] {
  return [
    { type: "hero" },
    { type: "sectionLabel", text: seller.name },
    {
      type: "metaLine",
      text: `${RatingFormatter.format({ value: seller.rating })} · ${DistanceFormatter.format({ meters: seller.distanceMeters })}`,
    },
    { type: "text", text: seller.categoryNames.join(" · ") },
    { type: "text", text: seller.isOpenNow ? "🟢 Открыт" : "🔴 Закрыт" },
    { type: "text", text: seller.workingHoursLabel },
    {
      type: "cardList",
      items: [
        {
          id: `open-${seller.sellerId}`,
          emoji: "🏪",
          title: "Открыть продавца",
          subtitle: seller.isOpenNow ? "Открыт сейчас" : "Сейчас закрыт",
          trailing: "",
          highlighted: true,
          action: { type: "OPEN_SELLER", payload: { sellerId: seller.sellerId } },
        },
      ],
    },
  ];
}

export const MapSheetAdapter = {
  toBlocks(vm: MapViewModel): ContentBlock[] {
    if (vm.state === "loading" || vm.state === "idle") {
      return [{ type: "skeleton" }];
    }
    if (vm.state === "error") {
      return [{ type: "errorRetry", text: "Не удалось загрузить данные карты.", retryAction: { type: "MAP_LOADED" } }];
    }
    if (vm.state === "empty" || vm.sellers.length === 0) {
      return [{ type: "empty", text: "Продавцы в этой области не найдены" }];
    }
    if (vm.bottomSheet === "hidden" || !vm.selectedSellerId) {
      return [];
    }
    const seller = vm.sellers.find((s) => s.sellerId === vm.selectedSellerId);
    if (!seller) return [];
    return sellerSummaryBlocks(seller);
  },
};
