import { type ReactNode } from 'react';
import { Overlay } from '@/containers/Overlay';

export interface ModalContainerProps {
  children: ReactNode;
  onDismiss?: () => void;
  labelledBy?: string;
}

/** Centered floating surface over a dimmed backdrop, for arbitrary content. */
export function ModalContainer({ children, onDismiss, labelledBy }: ModalContainerProps) {
  return (
    <>
      <Overlay onDismiss={onDismiss} />
      <div className="gm-modal-container" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </>
  );
}

export interface DialogContainerProps {
  children: ReactNode;
  onDismiss?: () => void;
  labelledBy: string;
}

/** Centered surface reserved for short, decision-focused prompts (confirm/cancel). */
export function DialogContainer({ children, onDismiss, labelledBy }: DialogContainerProps) {
  return (
    <>
      <Overlay onDismiss={onDismiss} />
      <div className="gm-dialog-container" role="alertdialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </>
  );
}
