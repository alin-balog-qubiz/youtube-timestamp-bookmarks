import type { AnchorHTMLAttributes } from 'react';

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function Link({ className = '', target, rel, ...props }: LinkProps) {
  const safeRel = target === '_blank' ? Array.from(new Set(`${rel ?? ''} noopener noreferrer`.trim().split(/\s+/))).join(' ') : rel;

  return <a {...props} target={target} rel={safeRel} className={`yb-link ${className}`.trim()} />;
}
