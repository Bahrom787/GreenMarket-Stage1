import type { ContentBlock } from "../contracts/ContentBlock";

/** Единая точка входа для всех экранов: ScreenViewModel → ContentBlock[].
 *  Builder ничего не вычисляет — трансформацию делает Adapter конкретного
 *  экрана; Builder лишь приводит его к общему контракту. */
export interface ScreenBuilder<TViewModel> {
  build(viewModel: TViewModel): ContentBlock[];
}
