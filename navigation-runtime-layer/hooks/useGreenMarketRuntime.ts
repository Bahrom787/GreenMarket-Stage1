import { useEffect, useMemo, useState, createContext, useContext, type ReactNode, createElement } from "react";
import type { Action } from "../contracts/Action";
import type { BusinessEvent } from "../BottomSheetDeclarative";
import { currentEntry, type NavigationEntry } from "../navigation/NavigationStack";
import {
  createGreenMarketRuntime,
  createNoopActionHandlers,
  type ActionHandlers,
  type GreenMarketRuntime,
  type RuntimeState,
} from "../runtime/GreenMarketRuntime";

/* ============================================================================
 * useGreenMarketRuntime — React-слой над runtime/GreenMarketRuntime.ts.
 *
 * Собирает воедино три ранее не связанных модуля: Navigation (стек
 * экранов), Runtime (dispatch + guard по availableActions) и React
 * (компоненты *Screen.tsx под catalog/, basket/, favorites/, product_card/,
 * purchase_options/, search/, seller_catalog/). До этого файла у каждого
 * *Screen.tsx не было общего способа получить текущий NavigationEntry и
 * типобезопасный dispatch — этот пробел и закрывается здесь.
 *
 * Сознательно НЕ реализует бизнес-логику: только подписка на изменения
 * состояния Runtime и переброс dispatch наружу (ТЗ-022 требование 9 —
 * Customer UI работает только с ViewModel/Action Catalog/Business Events).
 * ========================================================================== */

const RuntimeContext = createContext<GreenMarketRuntime | null>(null);

export interface GreenMarketRuntimeProviderProps {
  handlers?: ActionHandlers;
  initialEntry?: NavigationEntry;
  children: ReactNode;
}

/** Провайдер — один экземпляр Runtime на дерево Customer UI, как и один
 *  EventBus/GreenMarketEngine в BottomSheetDeclarative.tsx сегодня. */
export function GreenMarketRuntimeProvider(props: GreenMarketRuntimeProviderProps) {
  const runtime = useMemo(
    () => createGreenMarketRuntime(props.handlers ?? createNoopActionHandlers(), props.initialEntry),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runtime создаётся один раз на весь жизненный цикл провайдера
    []
  );
  return createElement(RuntimeContext.Provider, { value: runtime }, props.children);
}

function useRuntime(): GreenMarketRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error("useGreenMarketRuntime: не найден GreenMarketRuntimeProvider выше по дереву");
  }
  return runtime;
}

/** Текущее состояние Runtime (стек навигации) + типобезопасный dispatch.
 *  dispatch возвращает false, если Action не входит в availableActions
 *  текущего экрана — вызывающий код может это использовать, например,
 *  чтобы не отрисовывать недоступную кнопку (сама проверка — не бизнес-
 *  правило, а отражение уже готового ScreenDefinition, см. ТЗ-022 §4). */
export function useGreenMarketRuntime(): { state: RuntimeState; dispatch: (action: Action) => boolean } {
  const runtime = useRuntime();
  const [state, setState] = useState<RuntimeState>(runtime.getState());

  useEffect(() => runtime.subscribe(setState), [runtime]);

  return { state, dispatch: runtime.dispatch };
}

/** Текущий экран стека — удобный доступ без ручной деструктуризации
 *  state.navigation.stack на каждом месте использования. */
export function useCurrentScreen(): NavigationEntry {
  const { state } = useGreenMarketRuntime();
  return currentEntry(state.navigation);
}

/** Подписка на BusinessEvent (например, для MapProjection вне Bottom Sheet —
 *  по аналогии с eventBus.subscribe в BottomSheetDeclarative.tsx, но через
 *  общий Runtime, а не локальный eventBus конкретного компонента). */
export function useBusinessEvents(listener: (event: BusinessEvent) => void): void {
  const runtime = useRuntime();
  useEffect(() => runtime.onBusinessEvent(listener), [runtime, listener]);
}
