import { SearchScreen as SearchScreenDefinition } from "../screens/SearchScreen";
import type { SearchViewModel } from "./viewmodels/SearchViewModel";
import type { ContentBlock } from "../contracts/ContentBlock";

/** Единственный путь сборки контента экрана «Поиск»:
 *  ScreenDefinition → ScreenBuilder → ContentBlock[].
 *
 *  Импорт обновлён: ScreenDefinition теперь в общей screens/SearchScreen.ts,
 *  а не в удалённой search/screens/SearchScreenDefinition.ts — единственная
 *  правка в этом файле, вызванная переносом (архитектурное решение №1),
 *  логика самого файла не менялась. */
export function renderSearchBlocks(viewModel: SearchViewModel): ContentBlock[] {
  return SearchScreenDefinition.builder.build(viewModel);
}
