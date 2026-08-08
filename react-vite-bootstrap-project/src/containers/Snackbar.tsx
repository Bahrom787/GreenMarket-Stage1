import { type ReactNode } from 'react';

export interface SnackbarContainerProps {
  children: ReactNode;
}

/** Anchors a Snackbar near the bottom center of the viewport. */
export function SnackbarContainer({ children }: SnackbarContainerProps) {
  return <div className="gm-snackbar-container">{children}</div>;
}
