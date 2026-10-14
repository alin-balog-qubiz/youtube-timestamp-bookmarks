import { useEffect, useRef, useState } from 'react';

import { getBackup, reviewExport } from '@/services/messaging/settings-requests';
import { downloadBackup, getExportFilename } from '@/services/popup';

import type { Backup } from '@/models/backup';

import { Button, Dialog, Notice, Skeleton, TextInput, VideoSelector } from '@/ui';

interface ExportDialogProps {
  onClose: () => void;
  onCompleted: (filename: string) => void;
}

export default function ExportDialog({ onClose, onCompleted }: ExportDialogProps) {
  const [backup, setBackup] = useState<Backup | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  const isDisposedRef = useRef(false);
  const isExportingRef = useRef(false);
  const loadIdRef = useRef(0);
  const downloadControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isDisposedRef.current = false;
    void loadLibrary();
    return () => {
      isDisposedRef.current = true;
      loadIdRef.current++;
      downloadControllerRef.current?.abort();
    };
  }, []);

  async function loadLibrary() {
    const loadId = ++loadIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const current = await getBackup();
      if (isDisposedRef.current || loadId !== loadIdRef.current) return;

      setBackup(current);
      setSelectedVideoIds(current.videos.filter((video) => video.bookmarks.length > 0).map((video) => video.id));
    } catch (failure) {
      if (!isDisposedRef.current && loadId === loadIdRef.current) {
        setError(failure instanceof Error ? failure.message : 'Unable to read the library. Retry loading it.');
      }
    } finally {
      if (!isDisposedRef.current && loadId === loadIdRef.current) setIsLoading(false);
    }
  }

  async function exportSelection() {
    if (!backup || isLoading || isExportingRef.current || selectedBookmarkCount === 0) return;

    isExportingRef.current = true;
    setIsExporting(true);
    setError(null);
    setReviewNotice(null);
    try {
      const review = await reviewExport(selectedVideoIds, backup);
      if (isDisposedRef.current) return;

      if (review.status === 'stale') {
        const current = await getBackup();
        if (isDisposedRef.current) return;

        setBackup(current);
        setSelectedVideoIds((ids) => ids.filter((id) => current.videos.some((video) =>
          video.id === id && video.bookmarks.length > 0)));
        setReviewNotice('Selected videos changed in the library. Review the refreshed selection and choose Export again. Newly added videos are not selected.');
        return;
      }

      if (!review.backup.videos.some((video) => video.bookmarks.length > 0)) {
        setReviewNotice('No selected bookmarks remain. Review your selection before exporting.');
        return;
      }

      const filename = getExportFilename(name);
      const controller = new AbortController();
      downloadControllerRef.current = controller;
      await downloadBackup(review.backup, filename, controller.signal);
      if (!isDisposedRef.current) onCompleted(filename);
    } catch (failure) {
      if (!isDisposedRef.current) {
        setError(failure instanceof Error ? failure.message : 'Unable to export the selected bookmarks. Choose Export to retry.');
      }
    } finally {
      downloadControllerRef.current = null;
      isExportingRef.current = false;
      if (!isDisposedRef.current) setIsExporting(false);
    }
  }

  const videos = backup?.videos.filter((video) => video.bookmarks.length > 0).map((video) => ({
    id: video.id, title: video.title, bookmarkCount: video.bookmarks.length,
  })) ?? [];
  const selectedBookmarkCount = videos.reduce((total, video) =>
    total + (selectedVideoIds.includes(video.id) ? video.bookmarkCount : 0), 0);

  return (
    <Dialog
      open
      title="Export bookmarks"
      description="Select videos to download. Only videos and bookmarks are included; preferences stay on this device."
      onClose={onClose}
      pending={isExporting}
      footer={(
        <>
          <Button variant="quiet" disabled={isExporting} onClick={onClose}>Cancel</Button>
          <Button
            variant="accent"
            pending={isExporting}
            disabled={isLoading || isExporting || !backup || selectedBookmarkCount === 0}
            onClick={() => void exportSelection()}
          >Export</Button>
        </>
      )}
    >
      <div className="yb-dialog-fields">
        {isLoading ? <Skeleton rows={3} label="Loading videos for export" /> : backup ? (
          <VideoSelector
            videos={videos}
            selectedVideoIds={selectedVideoIds}
            onSelectionChange={setSelectedVideoIds}
            disabled={isExporting}
            emptyMessage="Your library has no bookmarks to export."
          />
        ) : null}
        <TextInput
          label="Filename (optional)"
          value={name}
          onChange={setName}
          disabled={isExporting}
          placeholder="youtube-bookmarks"
          help="Leave blank for a dated filename. A .json extension is added automatically."
        />
        {reviewNotice && <Notice>{reviewNotice}</Notice>}
        {error && <Notice variant="error">{error}</Notice>}
        {!backup && !isLoading && (
          <Button variant="quiet" onClick={() => void loadLibrary()}>Retry loading library</Button>
        )}
        {isExporting && <p className="yb-dialog-help" role="status">Reviewing the selection and waiting for the download to complete…</p>}
      </div>
    </Dialog>
  );
}
