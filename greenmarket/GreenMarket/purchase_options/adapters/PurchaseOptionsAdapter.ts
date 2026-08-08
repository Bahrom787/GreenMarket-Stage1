import type { ContentBlock, RowItem, OptionCardItem } from "../../contracts/ContentBlock";
import type { PurchaseOptionsViewModel, PurchaseOptionRecord, SelectedRoute } from "../viewmodels/PurchaseOptionsViewModel";
import { toOptionPriceVm, toOptionSubtitleParts, toSellerRatingVm } from "../presentation/PurchaseOptionsPresentation";
import { formatPrice, formatOptionSubtitle, formatSellerSubtitle } from "../formatting/Formatters";

/* Приватные строители блоков — не экспортируются, видны только внутри модуля.
 * Каждый отвечает за один случай экрана. */

function buildLoadingBlock(): ContentBlock[] {
  return [{ type: "skeleton" }];
}

function buildErrorBlock(): ContentBlock[] {
  return [{ type: "errorRetry", text: "Не удалось загрузить варианты покупки.", retryAction: { type: "PICK_PURCHASE" } }];
}

function buildEmptyBlock(): ContentBlock[] {
  return [{ type: "empty", text: "Нет доступных вариантов покупки." }];
}

function buildOptionsBlock(options: PurchaseOptionRecord[], selectedOptionId: PurchaseOptionsViewModel["selectedOptionId"]): ContentBlock {
  return {
    type: "cardList",
    items: options.map(
      (o): OptionCardItem => ({
        id: o.id,
        emoji: o.emoji,
        title: o.label,
        // Presentation отдаёт структурированные VM, formatting — готовую строку.
        subtitle: formatOptionSubtitle(toOptionSubtitleParts(o.summary)),
        trailing: formatPrice(toOptionPriceVm(o.summary)),
        highlighted: selectedOptionId === o.id,
        action: { type: "SELECT_PURCHASE_OPTION", payload: { optionId: o.id } },
      })
    ),
  };
}

function buildSellerListBlock(route: SelectedRoute): ContentBlock[] {
  return [
    { type: "sectionLabel", text: "Продавцы в маршруте" },
    {
      type: "list",
      items: route.sellers.map(
        (s): RowItem => ({
          id: s.sellerId,
          avatar: "🏪",
          title: s.name,
          subtitle: formatSellerSubtitle(toSellerRatingVm(s), s.distance),
          action: { type: "OPEN_SELLER", payload: { sellerId: s.sellerId } },
        })
      ),
    },
  ];
}

/** Блоки маршрута выбранного варианта — отдельный приватный сборщик, чтобы
 *  ветвление "маршрут ещё не рассчитан" не жило в toBlocks(). */
function buildRouteBlocks(route: SelectedRoute | null): ContentBlock[] {
  if (!route) return [];
  return buildSellerListBlock(route);
}

/** Все блоки "готового" сценария (варианты + при наличии — маршрут). */
function buildReadyBlocks(vm: PurchaseOptionsViewModel): ContentBlock[] {
  return [buildOptionsBlock(vm.options, vm.selectedOptionId), ...buildRouteBlocks(vm.selectedRoute)];
}

type Scenario = "loading" | "error" | "empty" | "ready";

/** Выбор сценария экрана — единственное место с ветвлением "что показывать".
 *  toBlocks() сам никаких condition'ов не содержит. */
function resolveScenario(vm: PurchaseOptionsViewModel): Scenario {
  if (vm.loadState === "loading") return "loading";
  if (vm.loadState === "error") return "error";
  if (vm.options.length === 0) return "empty";
  return "ready";
}

const SCENARIO_BUILDERS: Record<Scenario, (vm: PurchaseOptionsViewModel) => ContentBlock[]> = {
  loading: buildLoadingBlock,
  error: buildErrorBlock,
  empty: buildEmptyBlock,
  ready: buildReadyBlocks,
};

/** Adapter: PurchaseOptionsViewModel → ContentBlock[]. Единственное место,
 *  которое знает и доменные поля Purchase Optimizer, и примитивы разметки
 *  Bottom Sheet одновременно. Только преобразование формы данных и выбор
 *  сценария — ни бизнес-правил, ни форматирования строк здесь нет.
 *
 *    PurchaseOptionsViewModel → PurchaseOptionsAdapter → ContentBlock[] → BottomSheetRenderer
 */
export const PurchaseOptionsAdapter = {
  toBlocks(vm: PurchaseOptionsViewModel): ContentBlock[] {
    return SCENARIO_BUILDERS[resolveScenario(vm)](vm);
  },
};
