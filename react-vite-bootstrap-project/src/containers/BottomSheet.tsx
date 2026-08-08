import { type ReactNode } from 'react';
import { Overlay } from '@/containers/Overlay';

export interface BottomSheetContainerProps {
  children: ReactNode;
  onDismiss?: () => void;
  labelledBy?: string;
  'data-testid'?: string;
}

/** Anchors content to the bottom edge of the viewport, dismissible via backdrop/Escape. */
export function BottomSheetContainer({
  children,
  onDismiss,
  labelledBy,
  'data-testid': dataTestId,
}: BottomSheetContainerProps) {
  return (
    <>
      <Overlay onDismiss={onDismiss} />
      <div
        className="gm-bottom-sheet-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        data-testid={dataTestId}
      >
        <div className="gm-bottom-sheet-container__inner">{children}</div>
      </div>
    </>
  );
}
