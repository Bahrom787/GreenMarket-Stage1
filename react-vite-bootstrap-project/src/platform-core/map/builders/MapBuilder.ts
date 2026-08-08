import type { ScreenBuilder } from "@/platform-core/builders/ScreenBuilder";
import type { MapViewModel } from "@/platform-core/map/viewmodels/MapViewModel";
import { MapSheetAdapter } from "@/platform-core/map/adapters/MapSheetAdapter";

/** Обёртка над MapSheetAdapter под общий контракт ScreenBuilder — по образцу
 *  CatalogBuilder/SellerCardBuilder. Строит только содержимое Bottom Sheet;
 *  область карты собирается отдельно самим экраном (map/gis/MapAdapter). */
export const MapBuilder: ScreenBuilder<MapViewModel> = {
  build(viewModel) {
    return MapSheetAdapter.toBlocks(viewModel);
  },
};
