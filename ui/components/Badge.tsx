import type { ReactNode } from 'react';

export type BadgeProps = { children: ReactNode };

export function Badge({ children }: BadgeProps) {
  return <span className="yb-badge">{children}</span>;
}
