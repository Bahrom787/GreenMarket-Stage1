import type { ScreenDefinition } from './ScreenDefinition';

export const GreenBoardScreen: ScreenDefinition<Record<string, never>> = {
  builder: { build: () => [] },
  availableActions: ['GO_TO_MAIN'] as const,
};
