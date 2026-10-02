import { useId } from 'react';

import type { IconName } from './Icon';

import { Icon } from './Icon';

export type SegmentedChoiceProps = {
  label: string;
  labelHidden?: boolean;
  value: string;
  options: readonly { value: string; label: string; icon?: IconName; disabled?: boolean }[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function SegmentedChoice({ label, labelHidden = false, value, options, onChange, disabled }: SegmentedChoiceProps) {
  const groupId = useId();

  return (
    <fieldset className="yb-choice-fieldset" disabled={disabled}>
      <legend className={`yb-field-label${labelHidden ? ' yb-sr-only' : ''}`}>{label}</legend>
      <div className="yb-segmented">
        {options.map((option) => (
          <label key={option.value} className="yb-segmented-option">
            <input
              type="radio"
              name={groupId}
              value={option.value}
              checked={option.value === value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span>{option.icon && <Icon name={option.icon} size="small" />}{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
