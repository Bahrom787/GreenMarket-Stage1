import type { RatingVm } from "../presentation/RatingVm";

export const RatingFormatter = {
  format(vm: RatingVm): string {
    return `⭐ ${vm.value.toFixed(1)}`;
  },
};
