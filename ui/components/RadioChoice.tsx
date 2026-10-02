import { useId } from 'react';

export type RadioChoiceProps = {
  label: string;
  value: string;
  options: readonly { value: string; label: string; description?: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RadioChoice({ label, value, options, onChange, disabled }: RadioChoiceProps) {
  const groupId = useId();

  return (
    <fieldset className="yb-choice-fieldset" disabled={disabled}>
      <legend className="yb-field-label">{label}</legend>
      <div className="yb-radio-choices">
        {options.map((option, index) => (
          <label key={option.value} className="yb-radio-card">
            <input
              type="radio"
              name={groupId}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              aria-describedby={option.description ? `${groupId}-${index}-description` : undefined}
              onChange={() => onChange(option.value)}
            />
            <span className="yb-radio-copy">
              <strong>{option.label}</strong>
              {option.description && <span id={`${groupId}-${index}-description`}>{option.description}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
