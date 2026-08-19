import type { ScreenDefinition } from "./ScreenDefinition";
import type { StoreHomeViewModel } from "@/platform-core/viewmodels/StoreHomeViewModel";
import { StoreHomeBuilder } from "@/platform-core/builders/StoreHomeBuilder";

export const StoreHomeScreen: ScreenDefinition<StoreHomeViewModel> = {
  builder: StoreHomeBuilder,
  availableActions: ["BACK", "GO_TO_MAIN"] as const,
};
