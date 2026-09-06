import type { ReactNode } from 'react';
import { Stack } from '@/layout';

export function FilterPanel({
  children,
  testId,
  onInteract,
}: {
  children: ReactNode;
  testId?: string;
  onInteract?: () => void;
}) {
  return (
    <Stack
      gap="sm"
      onFocus={onInteract}
      onKeyDown={onInteract}
      onPointerDown={onInteract}
      data-testid={testId}
    >
      {children}
    </Stack>
  );
}
