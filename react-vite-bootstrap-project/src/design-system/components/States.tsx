import { type ReactNode } from 'react';
import { Text } from '@/design-system/components/Text';

interface StateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Placeholder for a list/screen with no content yet. Invites the next action. */
export function EmptyState({ icon, title, description, action }: StateProps) {
  return (
    <div className="gm-state gm-state--empty" role="status">
      {icon && <span className="gm-state__icon">{icon}</span>}
      <Text variant="title" className="gm-state__title">
        {title}
      </Text>
      {description && <Text tone="secondary">{description}</Text>}
      {action && <div className="gm-state__actions">{action}</div>}
    </div>
  );
}

/** Explains what went wrong and how to recover. Used for failed loads. */
export function ErrorState({ icon, title, description, action }: StateProps) {
  return (
    <div className="gm-state gm-state--error" role="alert">
      {icon && <span className="gm-state__icon">{icon}</span>}
      <Text variant="title" className="gm-state__title">
        {title}
      </Text>
      {description && <Text tone="secondary">{description}</Text>}
      {action && <div className="gm-state__actions">{action}</div>}
    </div>
  );
}
