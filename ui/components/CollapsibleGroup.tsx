import { useId, type ReactNode } from 'react';

import { Icon } from './Icon';

export type CollapsibleGroupProps = {
  title: ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children: ReactNode;
  className?: string;
};

export function CollapsibleGroup({ title, expanded, onExpandedChange, children, className = '' }: CollapsibleGroupProps) {
  const groupId = useId();

  return (
    <div className={`yb-collapsible ${className}`.trim()}>
      <button
        className="yb-collapsible-trigger"
        type="button"
        id={`${groupId}-trigger`}
        aria-expanded={expanded}
        aria-controls={`${groupId}-panel`}
        onClick={() => onExpandedChange(!expanded)}
      >
        <span className="yb-collapsible-title">{title}</span>
        <Icon name="chevron" />
      </button>
      <div className="yb-collapsible-panel" id={`${groupId}-panel`} role="region" aria-labelledby={`${groupId}-trigger`} hidden={!expanded}>
        {children}
      </div>
    </div>
  );
}
