import type { PriceVm } from "../presentation/PriceVm";

export const PriceFormatter = {
  format(vm: PriceVm): string {
    return vm.hasDiscount && vm.previous !== null ? `${vm.current} ₽ (было ${vm.previous} ₽)` : `${vm.current} ₽`;
  },
};
