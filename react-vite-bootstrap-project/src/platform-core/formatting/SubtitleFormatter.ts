import type { SubtitleParts } from "../presentation/SubtitleParts";

export const SubtitleFormatter = {
  format(vm: SubtitleParts): string {
    return vm.parts.filter(Boolean).join(" · ");
  },
};
