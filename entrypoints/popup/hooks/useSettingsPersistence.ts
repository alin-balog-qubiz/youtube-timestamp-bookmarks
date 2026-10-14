import { useEffect, useRef, useState } from 'react';

import { updateSettings } from '@/services/messaging/settings-requests';

import type { ColorChoice } from '@/models/appearance';
import type { MarkerPreferences } from '@/models/marker-preferences';

const customColorDelayMs = 100;
type ColorIntent = { choice: ColorChoice; revision: number };

// Settings alone owns this queue. Build each full request from the last confirmed
// preferences, not the snapshot captured when a color's debounce was scheduled.
export function useSettingsPersistence(
  preferences: MarkerPreferences | null,
  onPreferencesChange: (saved: MarkerPreferences) => void,
  onColorSaved: () => void,
) {
  const [colorPreview, setColorPreview] = useState<ColorChoice | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);

  const savedPreferencesRef = useRef(preferences);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const queuedWritesRef = useRef(0);
  const pendingColorRef = useRef<ColorIntent | null>(null);
  const colorRevisionRef = useRef(0);
  const savedColorRevisionRef = useRef<number | null>(null);
  const toastColorRevisionRef = useRef<number | null>(null);
  const notifiedColorRevisionRef = useRef<number | null>(null);
  const colorTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const colorErrorRef = useRef<string | null>(null);
  const isDisposedRef = useRef(false);

  useEffect(() => {
    isDisposedRef.current = false;
    return () => {
      isDisposedRef.current = true;
      clearTimeout(colorTimerRef.current);
      pendingColorRef.current = null;
      colorRevisionRef.current++;
    };
  }, []);

  useEffect(() => {
    if (queuedWritesRef.current === 0) savedPreferencesRef.current = preferences;
  }, [preferences]);

  function savePreferences(patch: Partial<MarkerPreferences>, intent?: ColorIntent): Promise<void> {
    queuedWritesRef.current++;
    const write = queueRef.current.then(async () => {
      if (isDisposedRef.current || (intent && intent.revision !== colorRevisionRef.current)) return;

      const saved = savedPreferencesRef.current;
      if (!saved) throw new Error('Preferences have not loaded.');

      const next = { ...saved, ...patch };
      if (next.theme === saved.theme && next.showMarkers === saved.showMarkers &&
        colorsMatch(next.defaultColor, saved.defaultColor)) return;

      const result = await updateSettings(next);
      if (isDisposedRef.current) return;

      savedPreferencesRef.current = result;
      onPreferencesChange(result);
    }).finally(() => {
      queuedWritesRef.current--;
    });
    // Keep the serialization chain usable after failure; the caller still receives
    // the rejection and decides how to report it. Failed writes are never retried.
    queueRef.current = write.catch(() => {});
    return write;
  }

  function selectColor(choice: ColorChoice, continuous = false) {
    if (isDisposedRef.current) return;

    clearTimeout(colorTimerRef.current);
    const intent = { choice, revision: ++colorRevisionRef.current };
    pendingColorRef.current = intent;
    toastColorRevisionRef.current = continuous ? null : intent.revision;
    colorErrorRef.current = null;
    setColorPreview(choice);
    setColorError(null);

    if (continuous) {
      colorTimerRef.current = setTimeout(() => void savePendingColor(), customColorDelayMs);
    } else {
      void savePendingColor();
    }
  }

  async function savePendingColor() {
    clearTimeout(colorTimerRef.current);
    const intent = pendingColorRef.current;
    if (!intent || isDisposedRef.current) return;

    pendingColorRef.current = null;
    try {
      await savePreferences({ defaultColor: intent.choice }, intent);
      if (isDisposedRef.current || intent.revision !== colorRevisionRef.current) return;

      colorErrorRef.current = null;
      setColorError(null);
      savedColorRevisionRef.current = intent.revision;
      notifyColorSaved();
      setColorPreview(null);
    } catch (failure) {
      if (isDisposedRef.current || intent.revision !== colorRevisionRef.current) return;

      const message = failure instanceof Error ? failure.message : 'Unable to save the default marker color.';
      colorErrorRef.current = message;
      setColorError(message);
    }
  }

  function notifyColorSaved() {
    const revision = toastColorRevisionRef.current;
    if (isDisposedRef.current || revision === null || revision !== colorRevisionRef.current ||
      revision !== savedColorRevisionRef.current || revision === notifiedColorRevisionRef.current) return;

    notifiedColorRevisionRef.current = revision;
    onColorSaved();
  }

  async function commitColor() {
    if (colorRevisionRef.current === 0 || isDisposedRef.current) return;

    toastColorRevisionRef.current = colorRevisionRef.current;
    if (await flushColor()) notifyColorSaved();
  }

  // Called before navigation while Settings is still mounted.
  // Unmount/unload cannot guarantee delivery from a destroyed popup.
  async function flushColor(): Promise<boolean> {
    do {
      await savePendingColor();
      const pendingWrites = queueRef.current;
      await pendingWrites;
      if (!pendingColorRef.current && pendingWrites === queueRef.current) break;
    } while (!isDisposedRef.current);
    return !isDisposedRef.current && colorErrorRef.current === null;
  }

  return { colorPreview, colorError, selectColor, commitColor, flushColor, savePreferences };
}

function colorsMatch(left: ColorChoice, right: ColorChoice): boolean {
  if (left.type === 'custom' && right.type === 'custom')
    return left.value.toLowerCase() === right.value.toLowerCase();

  return left.type === 'preset' && right.type === 'preset' && left.preset === right.preset;
}
