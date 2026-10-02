import { useId, type ReactNode } from 'react';

import '../styles/compositions.css';

export type SettingRowProps = {
  label: string;
  help?: string;
  control: ReactNode;
};

export function SettingRow({ label, help, control }: SettingRowProps) {
  const id = useId();

  return (
    <div
      className="yb-setting-row"
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={help ? `${id}-help` : undefined}
    >
      <div className="yb-setting-copy">
        <div id={`${id}-label`} className="yb-setting-label">{label}</div>
        {help && <p id={`${id}-help`} className="yb-setting-help">{help}</p>}
      </div>
      <div className="yb-setting-control">{control}</div>
    </div>
  );
}
