import type { ImportConflict } from '@/models/backup';

interface ImportConflictDetailsProps {
  title: string;
  conflicts: readonly ImportConflict[];
}

export function ImportConflictDetails({ title, conflicts }: ImportConflictDetailsProps) {
  if (conflicts.length === 0) return null;

  return (
    <details className="yb-transfer-diagnostics">
      <summary>{title} ({conflicts.length})</summary>
      <ul>{conflicts.map((conflict, index) => (
        <li key={`${conflict.videoId}-${conflict.timestamp ?? 'title'}-${index}`}>
          <strong>{conflict.videoTitle?.trim() || conflict.videoId}{conflict.timestamp === undefined ? ' · Video title' : ` · ${conflict.timestamp}s`}</strong>
          <p>Existing kept.</p>
          <dl className="yb-transfer-conflict-fields">
            {conflict.fields.map((field) => (
              <div key={field.field}>
                <dt>{field.field}</dt>
                <dd><span>Existing: </span>{describeValue(field.existing)}</dd>
                <dd><span>Incoming: </span>{describeValue(field.incoming)}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}</ul>
    </details>
  );
}

function describeValue(value: unknown): string {
  if (value === undefined) return 'Not set';
  if (typeof value === 'string') return JSON.stringify(value);

  return JSON.stringify(value) ?? String(value);
}
