import { useEffect, useRef, useState } from 'react';

import { importBackup, previewImport } from '@/services/messaging/settings-requests';
import { validateBackup } from '@/services/storage/backup';

import type { ImportMode, ImportPreview as ImportPreviewData, ValidatedImport } from '@/models/backup';

import { ImportPreview } from '@/ui';

interface ImportDialogProps {
  readonly file: File;
  readonly onClose: () => void;
}

interface IncomingFile {
  value: unknown;
  validated: ValidatedImport;
}

export default function ImportDialog({ file, onClose }: ImportDialogProps) {
  const [incoming, setIncoming] = useState<IncomingFile | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [isReading, setIsReading] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  const isDisposedRef = useRef(false);
  const isImportingRef = useRef(false);
  const fileReadIdRef = useRef(0);
  const previewIdRef = useRef(0);

  useEffect(() => {
    isDisposedRef.current = false;
    void readFile();
    return () => {
      isDisposedRef.current = true;
      fileReadIdRef.current++;
      previewIdRef.current++;
    };
  }, [file]);

  useEffect(() => {
    if (!incoming || completed) return;

    const previewId = ++previewIdRef.current;
    setIsPreviewing(true);
    setPreview(null);
    setError(null);
    void previewImport(incoming.value, mode, selectedVideoIds).then((nextPreview) => {
      if (isDisposedRef.current || previewId !== previewIdRef.current) return;

      setPreview(nextPreview);
    }).catch((failure: unknown) => {
      if (isDisposedRef.current || previewId !== previewIdRef.current) return;

      setError(failure instanceof Error ? failure.message : 'Unable to preview this import. Retry the preview.');
    }).finally(() => {
      if (!isDisposedRef.current && previewId === previewIdRef.current) setIsPreviewing(false);
    });
    return () => { previewIdRef.current++; };
  }, [incoming, mode, selectedVideoIds, previewRevision, completed]);

  async function readFile() {
    const readId = ++fileReadIdRef.current;
    setIsReading(true);
    setError(null);
    try {
      const text = await file.text();
      if (isDisposedRef.current || readId !== fileReadIdRef.current) return;

      const value: unknown = JSON.parse(text);
      const validated = validateBackup(value);
      setSelectedVideoIds(validated.videos.map((video) => video.id));
      setIncoming({ value, validated });
    } catch (failure) {
      if (!isDisposedRef.current && readId === fileReadIdRef.current) {
        setError(failure instanceof Error ? failure.message : 'Unable to read this JSON backup. Choose a valid file or retry.');
      }
    } finally {
      if (!isDisposedRef.current && readId === fileReadIdRef.current) setIsReading(false);
    }
  }

  function changeSelection(ids: string[]) {
    if (isImportingRef.current || completed) return;

    previewIdRef.current++;
    setPreview(null);
    setReviewNotice(null);
    setSelectedVideoIds(ids);
  }

  function changeMode(nextMode: ImportMode) {
    if (isImportingRef.current || completed || nextMode === mode) return;

    previewIdRef.current++;
    setPreview(null);
    setReviewNotice(null);
    setMode(nextMode);
  }

  function retryReview() {
    if (isImportingRef.current || completed) return;

    if (!incoming) {
      void readFile();
      return;
    }

    previewIdRef.current++;
    setPreview(null);
    setPreviewRevision((revision) => revision + 1);
  }

  async function confirmImport() {
    if (!preview || isReading || isPreviewing || isImportingRef.current || completed ||
      preview.incomingBookmarks === 0 || (preview.mode === 'merge' && preview.additions === 0)) return;

    isImportingRef.current = true;
    setIsImporting(true);
    setError(null);
    setReviewNotice(null);
    try {
      const result = await importBackup(preview);
      if (isDisposedRef.current) return;

      setPreview(result.preview);
      if (result.status === 'stale') {
        setReviewNotice('Relevant library data changed. Review the refreshed effect and choose the final action again. Nothing was imported.');
        return;
      }

      setCompleted(true);
    } catch (failure) {
      if (!isDisposedRef.current) {
        setError(failure instanceof Error ? failure.message : 'Unable to save the import. Your review is retained; choose the final action to retry.');
      }
    } finally {
      isImportingRef.current = false;
      if (!isDisposedRef.current) setIsImporting(false);
    }
  }

  const videos = incoming?.validated.videos.map((video) => ({
    id: video.id, title: video.title, bookmarkCount: Object.keys(video.bookmarks).length,
  })) ?? [];

  return (
    <ImportPreview
      fileName={file.name}
      mode={mode}
      onModeChange={changeMode}
      videos={videos}
      selectedVideoIds={selectedVideoIds}
      onSelectionChange={changeSelection}
      validated={incoming?.validated ?? null}
      preview={preview}
      reading={isReading}
      previewPending={isPreviewing}
      pending={isImporting}
      completed={completed}
      error={error}
      reviewNotice={reviewNotice}
      onRetry={retryReview}
      onConfirm={() => void confirmImport()}
      onClose={onClose}
    />
  );
}
