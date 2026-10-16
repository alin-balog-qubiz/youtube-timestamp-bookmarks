import type { ImportConflict } from '@/models/backup';

import { ImportVideoGroups } from './ImportVideoGroups';

interface ImportConflictDetailsProps {
  title: string;
  conflicts: readonly ImportConflict[];
}

export function ImportConflictDetails({ title, conflicts }: ImportConflictDetailsProps) {
  if (conflicts.length === 0) return null;

  return (
    <details className="yb-transfer-diagnostics">
      <summary>{title} ({conflicts.length})</summary>
      <p>Existing kept.</p>
      <ImportVideoGroups
        items={conflicts}
        renderItem={(conflict) => (
          <dl className="yb-transfer-conflict-fields">
            {conflict.fields.map((field) => (
              <div key={field.field}>
                <dt>{field.field}</dt>
                <dd><span>Existing: </span>{describeValue(field.existing)}</dd>
                <dd><span>Incoming: </span>{describeValue(field.incoming)}</dd>
              </div>
            ))}
          </dl>
        )}
      />
    </details>
  );
}

function describeValue(value: unknown): string {
  if (value === undefined) return 'Not set';
  if (typeof value === 'string') return JSON.stringify(value);

  return JSON.stringify(value) ?? String(value);
}
