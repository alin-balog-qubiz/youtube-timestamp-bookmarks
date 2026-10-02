import { useId } from 'react';

import { canAdjustTimestamp, formatTimestamp } from '@/utils/bookmark-time';

import { Button } from './Button';

import '../styles/overlays.css';

export interface TimestampAdjusterProps {
  timestamp: number;
  maxTimestamp: number | null;
  onChange: (timestamp: number) => void;
  disabled?: boolean;
}

const timestampSteps = [-5, -1, 1, 5] as const;

export function TimestampAdjuster({ timestamp, maxTimestamp, onChange, disabled = false }: TimestampAdjusterProps) {
  const labelId = useId();
  const helpId = useId();
  const validTimestamp = Number.isSafeInteger(timestamp) && timestamp >= 0;
  const knownDuration = maxTimestamp !== null && Number.isFinite(maxTimestamp) && maxTimestamp >= 0;

  return (
    <div className="yb-timestamp-adjuster" role="group" aria-labelledby={labelId} aria-describedby={helpId}>
      <span className="yb-dialog-field-label" id={labelId}>Timestamp</span>
      <div className="yb-timestamp-panel">
        <output className="yb-timestamp-display" aria-live="polite" aria-atomic="true">
          {validTimestamp ? formatTimestamp(timestamp).padStart(5, '0') : 'Unavailable'}
        </output>
        <div className="yb-timestamp-steps">
          {timestampSteps.map((step) => {
            const allowed = !disabled && validTimestamp && canAdjustTimestamp(timestamp, step, maxTimestamp);
            return (
              <Button
                key={step}
                variant="neutral"
                className="yb-timestamp-step"
                disabled={!allowed}
                aria-label={`${step < 0 ? 'Subtract' : 'Add'} ${Math.abs(step)} ${Math.abs(step) === 1 ? 'second' : 'seconds'}`}
                onClick={() => {
                  if (allowed) onChange(timestamp + step);
                }}
              >
                {step < 0 ? '−' : '+'}{Math.abs(step)}s
              </Button>
            );
          })}
        </div>
      </div>
      <p className={`yb-dialog-help${validTimestamp && knownDuration ? ' yb-sr-only' : ''}`} id={helpId}>
        {!validTimestamp
          ? 'The bookmark timestamp is unavailable.'
          : knownDuration
            ? `Adjust within 0:00–${formatTimestamp(Math.floor(maxTimestamp))}.`
            : 'Video duration is unavailable. Timestamp adjustment is disabled; name and color can still be edited.'}
      </p>
    </div>
  );
}
