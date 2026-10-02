import type { HTMLAttributes } from 'react';

export type SurfaceProps = HTMLAttributes<HTMLDivElement> & { treatment?: 'flat' | 'raised' | 'recessed' };

export function Surface({ treatment = 'flat', className = '', children, ...props }: SurfaceProps) {
  return <div {...props} className={`yb-surface yb-surface--${treatment} ${className}`.trim()}>{children}</div>;
}
