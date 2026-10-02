import type { ReactNode } from 'react';

import { Button } from './Button';
import { Icon } from './Icon';

export type ErrorStateProps = { title?: string; children: ReactNode; onRetry?: () => void; pending?: boolean };

export function ErrorState({ title = 'Unable to load bookmarks', children, onRetry, pending }: ErrorStateProps) {
  return (
    <div className="yb-state yb-error-state" role="alert">
      <Icon name="warning" />
      <h3>{title}</h3>
      <div className="yb-state-description">{children}</div>
      {onRetry && <div className="yb-state-action"><Button onClick={onRetry} pending={pending}>Try again</Button></div>}
    </div>
  );
}
