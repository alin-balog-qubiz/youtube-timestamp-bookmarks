import type { ReactNode } from 'react';

import { Icon } from './Icon';

export type EmptyStateProps = { title: string; children: ReactNode; action?: ReactNode };

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="yb-state yb-empty-state">
      <Icon name="bookmark" />
      <h3>{title}</h3>
      <div className="yb-state-description">{children}</div>
      {action && <div className="yb-state-action">{action}</div>}
    </div>
  );
}
