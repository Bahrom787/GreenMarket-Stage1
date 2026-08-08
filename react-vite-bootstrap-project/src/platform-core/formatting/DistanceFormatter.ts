import type { DistanceVm } from "../presentation/DistanceVm";

export const DistanceFormatter = {
  format(vm: DistanceVm): string {
    return vm.meters < 1000 ? `${Math.round(vm.meters)} м` : `${(vm.meters / 1000).toFixed(1)} км`;
  },
};
