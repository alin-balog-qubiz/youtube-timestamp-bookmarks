import { browser } from 'wxt/browser';

import type { Backup } from '@/models/backup';

export function getExportFilename(name: string, date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const defaultName = `youtube-bookmarks-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  // Treat the supplied text as a name, not a path; keep meaningful path segments.
  let base = name.trim().replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-');
  base = base.replace(/[.\s]+$/g, '').replace(/(?:\.json[.\s]*)+$/i, '').replace(/[.\s]+$/g, '');
  if (!base) base = defaultName;
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base)) base = `_${base}`;

  return `${base}.json`;
}

/** Resolves only on browser-confirmed completion; owns the temporary URL and listeners. */
export function downloadBackup(backup: Backup, filename: string, signal: AbortSignal): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: 'application/json' }));
  let downloadId: number | null = null;
  let hasSettled = false;
  let isListeningForDownload = false;

  try {
    browser.downloads.onChanged.addListener(handleDownloadChanged);
    isListeningForDownload = true;
    signal.addEventListener('abort', handleAbort, { once: true });
    if (signal.aborted) settle(new Error('Export was canceled.'));
    else void startDownload();
  } catch (failure) {
    settle(failure);
  }

  return promise;

  async function startDownload() {
    try {
      downloadId = await browser.downloads.download({ url, filename, conflictAction: 'uniquify' });
      if (signal.aborted) {
        await cancelDownload();
        return;
      }

      // Completion may precede download() returning its ID; search closes that race.
      const [download] = await browser.downloads.search({ id: downloadId });
      if (hasSettled) return;
      if (!download) {
        await cancelDownload(new Error('The browser could not find the export download. Please retry.'));
        return;
      }
      checkDownloadState(download.state, download.error);
    } catch (failure) {
      if (downloadId !== null && !hasSettled) await cancelDownload(failure);
      else settle(failure);
    }
  }

  function handleDownloadChanged(change: { id: number; state?: { current?: string }; error?: { current?: string } }) {
    if (change.id !== downloadId) return;
    checkDownloadState(change.state?.current, change.error?.current);
  }

  function checkDownloadState(state: string | undefined, error: string | undefined) {
    if (state === 'complete') settle();
    if (state === 'interrupted') settle(new Error(`Export download was interrupted${error ? `: ${error}` : '.'}`));
  }

  function handleAbort() {
    // A pending download() must return its ID before cancellation can release its URL.
    if (downloadId !== null && !hasSettled) void cancelDownload();
  }

  async function cancelDownload(failure: unknown = new Error('Export was canceled.')) {
    try {
      if (downloadId !== null) await browser.downloads.cancel(downloadId);
      settle(failure);
    } catch (cancelFailure) {
      settle(cancelFailure);
    }
  }

  function settle(failure?: unknown) {
    if (hasSettled) return;
    hasSettled = true;
    if (isListeningForDownload) browser.downloads.onChanged.removeListener(handleDownloadChanged);
    signal.removeEventListener('abort', handleAbort);
    URL.revokeObjectURL(url);
    if (failure !== undefined) reject(failure);
    else resolve();
  }
}
