import { type ReactNode } from 'react';
import { Text } from '@/design-system/components/Text';

export interface SnackbarProps {
  children: ReactNode;
  tone?: 'default' | 'error';
  action?: ReactNode;
  'data-testid'?: string;
}

/** Transient, low-priority message. Positioned by the Snackbar navigation container. */
export function Snackbar({ children, tone = 'default', action, 'data-testid': dataTestId }: SnackbarProps) {
  return (
    <div
      className={['gm-snackbar', tone === 'error' ? 'gm-snackbar--error' : ''].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      data-testid={dataTestId}
    >
      <Text tone="onBrand">{children}</Text>
      {action && <span className="gm-snackbar__action">{action}</span>}
    </div>
  );
}

export interface BottomSheetSurfaceProps {
  children: ReactNode;
  titleId?: string;
  title?: string;
  /** Optional slot for a close/dismiss control (e.g. an IconButton), rendered above the content well. */
  closeSlot?: ReactNode;
  'data-testid'?: string;
}

/**
 * Visual content surface for a bottom sheet: grab handle + content well.
 * Positioning/backdrop/drag behavior is handled by the Bottom Sheet
 * navigation container in src/containers.
 */
export function BottomSheetSurface({
  children,
  titleId,
  title,
  closeSlot,
  'data-testid': dataTestId,
}: BottomSheetSurfaceProps) {
  return (
    <div className="gm-bottom-sheet" data-testid={dataTestId}>
      <span className="gm-bottom-sheet__handle" aria-hidden="true" />
      {closeSlot}
      {title && (
        <Text as="h2" id={titleId} variant="title" className="gm-bottom-sheet__title">
          {title}
        </Text>
      )}
      <div className="gm-bottom-sheet__content">{children}</div>
    </div>
  );
}

export interface DialogSurfaceProps {
  titleId: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Visual content of a dialog: title, body, actions. Positioning/backdrop is
 * handled by the Dialog navigation container in src/containers.
 */
export function DialogSurface({ titleId, title, children, actions }: DialogSurfaceProps) {
  return (
    <div className="gm-dialog">
      <Text as="h2" id={titleId} variant="title">
        {title}
      </Text>
      <Text tone="secondary">{children}</Text>
      {actions && <div className="gm-dialog__actions">{actions}</div>}
    </div>
  );
}
