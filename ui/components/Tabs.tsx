import type { KeyboardEvent } from 'react';

export type TabsProps = {
  label?: string;
  value: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  idPrefix: string;
};

export function Tabs({ label = 'Navigation', value, options, onChange, idPrefix }: TabsProps) {
  const enabledOptions = options.filter((option) => !option.disabled);
  const tabStop = enabledOptions.find((option) => option.value === value)?.value ?? enabledOptions[0]?.value;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, optionValue: string) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    if (enabledOptions.length === 0) return;

    event.preventDefault();
    const currentIndex = enabledOptions.findIndex((option) => option.value === optionValue);
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? enabledOptions.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + enabledOptions.length) % enabledOptions.length;
    const nextOption = enabledOptions[nextIndex];
    if (!nextOption) return;
    const tabList = event.currentTarget.parentElement;
    const nextTab = tabList?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[options.findIndex((option) => option.value === nextOption.value)];
    nextTab?.focus();
    onChange(nextOption.value);
  }

  return (
    <div className="yb-tabs" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="yb-tab"
          role="tab"
          id={`${idPrefix}-tab-${option.value}`}
          aria-controls={`${idPrefix}-panel-${option.value}`}
          aria-selected={option.value === value}
          tabIndex={option.value === tabStop ? 0 : -1}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
