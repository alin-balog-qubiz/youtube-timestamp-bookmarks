import type { ReactNode } from 'react';

export type SectionHeaderProps = { title: string; metadata?: ReactNode; action?: ReactNode; level?: 2 | 3 | 4 };

export function SectionHeader({ title, metadata, action, level = 3 }: SectionHeaderProps) {
  const Heading = level === 2 ? 'h2' : level === 4 ? 'h4' : 'h3';

  return (
    <div className="yb-section-header">
      <div className="yb-section-copy">
        <Heading>{title}</Heading>
        {metadata !== undefined && metadata !== null && <div className="yb-section-metadata">{metadata}</div>}
      </div>
      {action !== undefined && action !== null && <div className="yb-section-action">{action}</div>}
    </div>
  );
}
