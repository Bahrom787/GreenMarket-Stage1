import type { Action, ActionType } from "../contracts/Action";
import type { BusinessEvent } from "../BottomSheetDeclarative";
import {
  createNavigationState,
  currentEntry,
  push,
  pop,
  reset,
  type NavigationState,
  type NavigationEntry,
  type ScreenId,
} from "../navigation/NavigationStack";
import { isActionAllowed } from "../navigation/ScreenRegistry";

/* ============================================================================
 * GreenMarketRuntime — недостающий связующий слой между Navigation
 * (стек экранов) и предметной областью (Action → BusinessEvent).
 *
 * Соответствует ТЗ-022 "Подготовка к внедрению FSM Engine":
 *  - Требование 1: любое изменение — только через dispatch(Action), Runtime
 *    не выставляет наружу способа изменить состояние экрана напрямую.
 *  - Требование 4/9: Runtime не решает, ДОСТУПНО ли действие бизнес-логике —
 *    это делает services (см. ActionHandlers ниже); Runtime лишь
 *    маршрутизирует Action к обработчику и применяет навигационный эффект.
 *  - Требование 8/10: обработка бизнес-действий подключается через
 *    инъекцию (ActionHandlers), а не жёстко зашита в Runtime — сегодня это
 *    может быть CRUD-заглушка (см. createNoopActionHandlers), позже —
 *    адаптер к FSM Engine, без изменения публичного API Runtime.
 *
 * Runtime сознательно НЕ содержит бизнес-правил (какие товары доступны,
 * можно ли добавить товар в корзину и т.п.) — только: (а) проверку "разрешён
 * ли этот Action на этом экране" (структурное свойство ScreenDefinition, не
 * бизнес-правило) и (б) переходы между экранами, которые сами являются
 * частью Action Catalog (OPEN_*, BACK, GO_TO_MAIN, CLOSE_SCREEN).
 * ========================================================================== */

/** Абстракция обработки бизнес-действий (ТЗ-022 требование 8). Реализация
 *  может быть CRUD-заглушкой сегодня и FSM Engine завтра — сигнатура не
 *  меняется. Обработчик получает уже провалидированный (экраном разрешённый)
 *  Action и возвращает события, случившиеся в результате. */
export interface ActionHandlers {
  handle(action: Action, screen: ScreenId): BusinessEvent[] | void;
}

/** Заглушка по умолчанию — ничего не решает, только позволяет Runtime
 *  работать до подключения реального обработчика (CRUD/FSM Engine). */
export const createNoopActionHandlers = (): ActionHandlers => ({
  handle: () => undefined,
});

export interface RuntimeState {
  readonly navigation: NavigationState;
}

export interface GreenMarketRuntime {
  getState(): RuntimeState;
  /** Провалидированный dispatch: если action.type не входит в
   *  availableActions текущего экрана (screens/*.ts), Action отклоняется —
   *  Runtime не выполняет ни навигационный эффект, ни вызов ActionHandlers.
   *  Возвращает true, если Action был принят и обработан. */
  dispatch(action: Action): boolean;
  subscribe(listener: (state: RuntimeState) => void): () => void;
  onBusinessEvent(listener: (event: BusinessEvent) => void): () => void;
}

/** Навигационные эффекты Action Catalog — целиком декларативны: Action →
 *  новый NavigationEntry / переход по стеку. Не бизнес-логика (требование 4):
 *  экран, на который переходит пользователь, задан самим Action, а не
 *  вычислен Runtime. */
function applyNavigation(nav: NavigationState, action: Action): NavigationState {
  switch (action.type) {
    case "OPEN_SELLER":
      return push(nav, { screen: "SellerCard", params: { sellerId: action.payload.sellerId } });
    case "OPEN_PRODUCT":
      return push(nav, {
        screen: "ProductCard",
        params: { sellerId: action.payload.sellerId, productId: action.payload.productId },
      });
    case "OPEN_SEARCH":
      return push(nav, { screen: "Search", params: {} });
    case "PICK_PURCHASE":
      return push(nav, { screen: "PurchaseOptions", params: {} });
    case "SELECT_CATEGORY":
      return push(nav, { screen: "SellerCatalog", params: { sellerId: action.payload.sellerId, categoryId: action.payload.categoryId } });
    case "START_PURCHASE":
      return push(nav, { screen: "Basket", params: {} });
    case "BACK":
    case "CLOSE_SCREEN":
      return pop(nav);
    case "GO_TO_MAIN":
      return reset(nav);
    default:
      return nav;
  }
}

export function createGreenMarketRuntime(
  handlers: ActionHandlers = createNoopActionHandlers(),
  initialEntry?: NavigationEntry
): GreenMarketRuntime {
  let state: RuntimeState = { navigation: createNavigationState(initialEntry) };
  const stateListeners = new Set<(state: RuntimeState) => void>();
  const eventListeners = new Set<(event: BusinessEvent) => void>();

  return {
    getState: () => state,

    dispatch(action: Action): boolean {
      const screen = currentEntry(state.navigation).screen;
      if (!isActionAllowed(screen, action.type satisfies ActionType)) {
        return false;
      }

      const events = handlers.handle(action, screen) ?? [];
      const navigation = applyNavigation(state.navigation, action);

      state = { navigation };
      stateListeners.forEach((fn) => fn(state));
      events.forEach((event) => eventListeners.forEach((fn) => fn(event)));
      return true;
    },

    subscribe(listener) {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },

    onBusinessEvent(listener) {
      eventListeners.add(listener);
      return () => eventListeners.delete(listener);
    },
  };
}
