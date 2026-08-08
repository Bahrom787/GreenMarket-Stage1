import type { ActionType } from "../contracts/Action";
import type { ScreenBuilder } from "../builders/ScreenBuilder";

/** Идентификатор допустимого действия экрана — алиас над Action["type"] из
 *  общего каталога (contracts/Action.ts). Отдельное имя, а не прямое
 *  использование ActionType, — чтобы ScreenDefinition читался как "список
 *  разрешённых действий экрана", а не тянул за собой семантику всего каталога. */
export type ActionId = ActionType;

/** Единая точка описания экрана: ViewModel + его Builder + разрешённые Action.
 *  Ничего не вычисляет и не решает — только композиция уже существующих
 *  элементов (adapters/, builders/, viewmodels/ не переносятся и не меняются). */
export interface ScreenDefinition<TViewModel> {
  builder: ScreenBuilder<TViewModel>;
  availableActions: readonly ActionId[];
}
