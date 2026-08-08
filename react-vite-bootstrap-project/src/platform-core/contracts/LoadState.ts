/** Общее состояние загрузки ViewModel — единый тип для всех экранов Customer UI.
 *  Каждый доменный ViewModel (SellerCardViewModel, PurchaseOptionsViewModel и
 *  далее) использует этот тип вместо того, чтобы заново объявлять
 *  "loading" | "error" | "ready" у себя. */
export type LoadState = "loading" | "error" | "ready";
