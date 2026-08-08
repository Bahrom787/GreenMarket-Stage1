/** Общее состояние экрана результатов/списка — шире, чем LoadState
 *  (loading/error/ready): различает "ещё не начинали" (Idle) и "искали, но
 *  не нашли" (Empty), которые LoadState не покрывает. Используется Search
 *  и далее — Catalog, Favorites, Orders, History. */
export type ViewState = "idle" | "loading" | "success" | "empty" | "error";
