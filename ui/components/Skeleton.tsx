export type SkeletonProps = { rows?: number; label?: string };

export function Skeleton({ rows = 3, label = 'Loading bookmarks' }: SkeletonProps) {
  const rowCount = Number.isFinite(rows) ? Math.max(1, Math.floor(rows)) : 3;

  return (
    <div className="yb-skeleton" role="status" aria-busy="true" aria-label={label}>
      <span className="yb-sr-only">{label}</span>
      <div aria-hidden="true">
        {Array.from({ length: rowCount }, (_, index) => (
          <div className="yb-skeleton-row" key={index}><span /><span /></div>
        ))}
      </div>
    </div>
  );
}
