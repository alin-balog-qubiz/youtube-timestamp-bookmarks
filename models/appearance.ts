export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type ColorChoice =
  | { type: 'preset'; preset: 'accent' | 'gray' | 'ink' }
  | { type: 'custom'; value: string };

const hexColorPattern = /^#[0-9a-f]{6}$/i;

export function validateColorChoice(value: unknown, field: string): ColorChoice {
  const choice = validateChoiceObject(value, field);
  if (choice.type === 'preset') {
    validateChoiceFields(choice, field, ['type', 'preset']);
    if (choice.preset !== 'accent' && choice.preset !== 'gray' && choice.preset !== 'ink')
      throw new Error(`${field}.preset must be accent, gray, or ink`);

    return { type: 'preset', preset: choice.preset };
  }

  if (choice.type === 'custom') {
    validateChoiceFields(choice, field, ['type', 'value']);
    return { type: 'custom', value: validateHexColor(choice.value, `${field}.value`) };
  }

  throw new Error(`${field}.type must be preset or custom`);
}

/** Legacy hex colors remain fixed Custom choices, including their original letter case. */
export function validateLegacyColor(value: unknown, field: string): ColorChoice {
  return { type: 'custom', value: validateHexColor(value, field) };
}

export function validateThemePreference(value: unknown, field: string): ThemePreference {
  if (value !== 'light' && value !== 'dark' && value !== 'system')
    throw new Error(`${field} must be light, dark, or system`);

  return value;
}

function validateChoiceObject(value: unknown, field: string): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  )
    throw new Error(`${field} must be a color-choice object`);

  return value as Record<string, unknown>;
}

function validateChoiceFields(choice: Record<string, unknown>, field: string, allowedFields: string[]): void {
  for (const key of Object.keys(choice)) {
    if (!allowedFields.includes(key))
      throw new Error(`${field}.${key} is not supported`);
  }
}

function validateHexColor(value: unknown, field: string): string {
  if (typeof value !== 'string' || !hexColorPattern.test(value))
    throw new Error(`${field} must be a six-digit hex color (#rrggbb)`);

  return value;
}
