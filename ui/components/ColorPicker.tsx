import { useEffect, useId, useState, type CSSProperties } from 'react';

import { resolveColorChoice } from '../utils/color';
import { useTheme } from '../utils/theme';

import type { ColorChoice } from '../utils/types';

export type ColorPickerProps = {
  label?: string;
  value?: ColorChoice;
  labelHidden?: boolean;
  defaultChoice: ColorChoice;
  onChange: (choice: ColorChoice | undefined) => void;
  allowDefault?: boolean;
  disabled?: boolean;
};

const presets = [
  { value: 'accent', label: 'Accent' },
  { value: 'gray', label: 'Gray' },
  { value: 'ink', label: 'Ink' },
] as const;

export function ColorPicker({
  label = 'Marker color', labelHidden = false, value, defaultChoice, onChange,
  allowDefault = false, disabled,
}: ColorPickerProps) {
  const [customValue, setCustomValue] = useState(value?.type === 'custom' ? value.value : defaultChoice.type === 'custom' ? defaultChoice.value : '#2563eb');

  const groupId = useId();
  const { resolvedTheme } = useTheme();
  const effectiveChoice = value ?? defaultChoice;
  const isInheriting = allowDefault && value === undefined;
  const selectedValue = isInheriting ? 'default' : effectiveChoice.type === 'custom' ? 'custom' : effectiveChoice.preset;
  const defaultName = defaultChoice.type === 'custom' ? defaultChoice.value : presets.find((preset) => preset.value === defaultChoice.preset)?.label;

  useEffect(() => {
    if (value?.type === 'custom') setCustomValue(value.value);
    else if (value === undefined && !allowDefault && defaultChoice.type === 'custom') setCustomValue(defaultChoice.value);
  }, [value, defaultChoice, allowDefault]);

  return (
    <fieldset className="yb-choice-fieldset yb-color-picker" disabled={disabled}>
      <legend className={`yb-field-label${labelHidden ? ' yb-sr-only' : ''}`}>{label}</legend>
      <div className="yb-color-panel">
        <div className="yb-color-choices">
          <div className="yb-color-presets">
            {presets.map((preset) => {
              const choice: ColorChoice = { type: 'preset', preset: preset.value };
              const style = { '--yb-swatch': resolveColorChoice(choice, defaultChoice, resolvedTheme) } as CSSProperties;
              return (
                <label key={preset.value} className="yb-color-option" style={style} title={preset.label}>
                  <input type="radio" name={groupId} checked={selectedValue === preset.value} onChange={() => onChange(choice)} />
                  <span className="yb-color-dot" aria-hidden="true" />
                  <span className="yb-sr-only">{preset.label}</span>
                </label>
              );
            })}
          </div>
          <div className={`yb-color-custom-control${selectedValue === 'custom' ? ' is-selected' : ''}`}>
            <label className="yb-color-custom-choice">
              <input type="radio" name={groupId} checked={selectedValue === 'custom'} onChange={() => onChange({ type: 'custom', value: customValue })} />
              <span>Custom</span>
            </label>
            <input
              className="yb-color-input"
              type="color"
              aria-label={`Custom ${label.toLowerCase()}`}
              aria-describedby={isInheriting ? `${groupId}-inherited-color` : undefined}
              value={customValue}
              onChange={(event) => {
                setCustomValue(event.currentTarget.value);
                onChange({ type: 'custom', value: event.currentTarget.value });
              }}
            />
          </div>
        </div>
        {allowDefault && (
          <label className="yb-color-default">
            <input type="radio" name={groupId} checked={selectedValue === 'default'} onChange={() => onChange(undefined)} />
            <span>Use default</span>
          </label>
        )}
      </div>
      {isInheriting && (
        <span className="yb-sr-only" id={`${groupId}-inherited-color`}>Inherited default: {defaultName}</span>
      )}
    </fieldset>
  );
}
