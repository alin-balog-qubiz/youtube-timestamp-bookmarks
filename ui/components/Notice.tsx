import type { ReactNode } from 'react';

import { Icon } from './Icon';

export type NoticeProps = { children: ReactNode; variant?: 'info' | 'warning' | 'error'; action?: ReactNode };

export function Notice({ children, variant = 'info', action }: NoticeProps) {
  return (
    <div className={`yb-notice yb-notice--${variant}`} role={variant === 'error' ? 'alert' : 'note'}>
      <Icon name={variant === 'info' ? 'info' : 'warning'} />
      <div className="yb-notice-content">{children}</div>
      {action && <div className="yb-notice-action">{action}</div>}
    </div>
  );
}
