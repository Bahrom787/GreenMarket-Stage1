export interface PriceVm {
  current: number;
  previous: number | null;
  hasDiscount: boolean;
}
