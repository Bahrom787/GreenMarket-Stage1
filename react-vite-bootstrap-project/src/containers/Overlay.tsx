import { useEffect, type ReactNode } from 'react';
import '@/containers/containers.css';

export interface OverlayProps {
  onDismiss?: () => void;
  className?: string;
}

/** Full-screen dimmed backdrop. Closes on click and Escape when dismissible. */
export function Overlay({ onDismiss, className }: OverlayProps) {
  useEffect(() => {
    if (!onDismiss) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className={['gm-overlay', className].filter(Boolean).join(' ')}
      onClick={onDismiss}
      aria-hidden="true"
    />
  );
}

export interface FullScreenContainerProps {
  children: ReactNode;
  className?: string;
}

/** Takes over the entire viewport — for flows like checkout or onboarding. */
export function FullScreenContainer({ children, className }: FullScreenContainerProps) {
  return (
    <div className={['gm-full-screen-container', className].filter(Boolean).join(' ')} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
