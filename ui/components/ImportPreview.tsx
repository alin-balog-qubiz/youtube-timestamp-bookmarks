import type { ImportMode, ImportPreview as ImportPreviewData, ValidatedImport } from '@/models/backup';

import { Button } from './Button';
import { Dialog } from './Dialog';
import { ImportConflictDetails } from './ImportConflictDetails';
import { Notice } from './Notice';
import { RadioChoice } from './RadioChoice';
import { Skeleton } from './Skeleton';
import { VideoSelector, type TransferVideo } from './VideoSelector';

export interface ImportPreviewProps {
  onClose: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  fileName: string;
  mode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
  videos: readonly TransferVideo[];
  selectedVideoIds: readonly string[];
  onSelectionChange: (ids: string[]) => void;
  validated: ValidatedImport | null;
  preview: ImportPreviewData | null;
  reading: boolean;
  previewPending: boolean;
  pending: boolean;
  completed: boolean;
  error: string | null;
  reviewNotice: string | null;
}

const importModes = [
  { value: 'merge', label: 'Merge', description: 'Add missing bookmarks. Existing titles and bookmark details win.' },
  { value: 'replace', label: 'Replace', description: 'Install the selected videos as the entire library. Preferences are unchanged.' },
] as const;

export function ImportPreview({
  onClose, onConfirm, onRetry, fileName, mode, onModeChange, videos, selectedVideoIds,
  onSelectionChange, validated, preview, reading, previewPending, pending, completed, error, reviewNotice,
}: ImportPreviewProps) {
  const selectedBookmarks = videos.reduce((total, video) =>
    total + (selectedVideoIds.includes(video.id) ? video.bookmarkCount : 0), 0);
  const nothingNew = mode === 'merge' && preview !== null && preview.additions === 0;
  const confirmationBlocked = reading || previewPending || pending || !preview || selectedBookmarks === 0 || nothingNew;
  const diagnostics = preview?.diagnostics ?? validated?.diagnostics ?? [];
  const bookmarkConflicts = preview?.conflicts.filter((conflict) => conflict.timestamp !== undefined) ?? [];
  const titleDifferences = preview?.conflicts.filter((conflict) => conflict.timestamp === undefined) ?? [];

  return (
    <Dialog
      open
      onClose={onClose}
      title={completed ? 'Import completed' : 'Import bookmarks'}
      description="Transfer videos and bookmarks only. Preferences and inherited default colors are not imported."
      pending={pending}
      footer={completed ? (
        <Button variant="accent" onClick={onClose}>Done</Button>
      ) : (
        <>
          <Button variant="quiet" disabled={pending} onClick={onClose}>Cancel</Button>
          <Button
            variant={mode === 'replace' ? 'danger' : 'accent'}
            pending={pending}
            disabled={confirmationBlocked}
            onClick={onConfirm}
          >{mode === 'replace' ? 'Replace library' : 'Merge'}</Button>
        </>
      )}
    >
      <div className="yb-dialog-fields">
        <div className="yb-import-file">
          <span className="yb-dialog-field-label">Backup file</span>
          <strong>{fileName}</strong>
        </div>
        {reading && <Skeleton rows={3} label="Reading and validating the JSON backup" />}
        {validated && (
          <>
            <VideoSelector
              videos={videos}
              selectedVideoIds={selectedVideoIds}
              onSelectionChange={onSelectionChange}
              disabled={pending || completed}
              emptyMessage="This file has no valid bookmarks to import. It cannot clear your library."
            />
            {!completed && (
              <RadioChoice
                label="Import mode"
                value={mode}
                options={importModes}
                disabled={pending}
                onChange={(value) => {
                  if (value === 'merge' || value === 'replace') onModeChange(value);
                }}
              />
            )}
            <dl className="yb-import-counts">
              <div><dt>Validation omissions</dt><dd>{validated.skippedVideos} videos · {validated.skippedBookmarks} bookmarks</dd></div>
              {preview && (
                <>
                  <div><dt>Selected data</dt><dd>{preview.incomingVideos} videos · {preview.incomingBookmarks} bookmarks</dd></div>
                  {mode === 'merge' && (
                    <>
                      <div><dt>{completed ? 'Bookmarks added' : 'Bookmarks to add'}</dt><dd>{preview.additions} across {preview.addedVideos} new videos</dd></div>
                      <div><dt>Identical duplicates skipped</dt><dd>{preview.skippedDuplicates}</dd></div>
                      <div><dt>Existing bookmark conflicts skipped</dt><dd>{preview.skippedConflicts}</dd></div>
                    </>
                  )}
                </>
              )}
            </dl>
            {preview && (completed ? (
              <Notice>
                {mode === 'merge'
                  ? `Saved ${preview.additions} new bookmarks across ${preview.addedVideos} new videos. ${preview.skippedDuplicates} identical duplicates and ${preview.skippedConflicts} bookmark conflicts were skipped; existing data was kept.`
                  : `Replaced the library with ${preview.incomingBookmarks} bookmarks across ${preview.incomingVideos} videos. Removed the previous ${preview.currentBookmarks} bookmarks across ${preview.currentVideos} videos.`}
                {' '}Validation omitted {preview.skippedVideos} videos and {preview.skippedBookmarks} bookmarks. Diagnostics remain below. Preferences were not changed.
              </Notice>
            ) : mode === 'replace' ? (
              <Notice variant="warning">
                Replace library removes all current {preview.currentBookmarks} bookmarks across {preview.currentVideos} videos, including videos absent from this file or deselected here. It installs only the selected {preview.incomingBookmarks} bookmarks across {preview.incomingVideos} videos. Skipped records will not be restored. This cannot be undone.
              </Notice>
            ) : (
              <Notice>Merge adds missing bookmarks only. Existing video titles and bookmark metadata are kept.</Notice>
            ))}
            {nothingNew && !completed && <Notice>Nothing new to import. Duplicates and conflicts remain available for inspection below.</Notice>}
            {diagnostics.length > 0 && (
              <details className="yb-transfer-diagnostics">
                <summary>Validation omissions ({validated.skippedVideos} videos · {validated.skippedBookmarks} bookmarks)</summary>
                <ul>
                  {diagnostics.map((diagnostic, index) => (
                    <li key={`${diagnostic.location}-${index}`}>
                      <strong>{diagnostic.videoTitle?.trim() || diagnostic.videoId || diagnostic.location}{diagnostic.timestamp === undefined ? '' : ` · ${diagnostic.timestamp}s`}</strong>
                      <span className="yb-dialog-help">{diagnostic.location}</span>
                      <p>{diagnostic.reason}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {preview && preview.duplicates.length > 0 && (
              <details className="yb-transfer-diagnostics">
                <summary>Identical duplicates ({preview.duplicates.length})</summary>
                <ul>{preview.duplicates.map((duplicate) => (
                  <li key={`${duplicate.videoId}-${duplicate.timestamp}`}>
                    <strong>{duplicate.videoTitle?.trim() || duplicate.videoId} · {duplicate.timestamp}s</strong>
                    <p>Identical bookmark. Existing kept.</p>
                  </li>
                ))}</ul>
              </details>
            )}
            <ImportConflictDetails title="Bookmark metadata conflicts" conflicts={bookmarkConflicts} />
            <ImportConflictDetails title="Video title differences" conflicts={titleDifferences} />
          </>
        )}
        {previewPending && <p className="yb-dialog-help" role="status">Reading the library and recomputing the selected import…</p>}
        {pending && <p className="yb-dialog-help" role="status">Saving the reviewed import…</p>}
        {reviewNotice && <Notice>{reviewNotice}</Notice>}
        {error && <Notice variant="error">{error}</Notice>}
        {!reading && !previewPending && !pending && !completed && (!validated || !preview) && (
          <Button variant="quiet" onClick={onRetry}>{validated ? 'Retry preview' : 'Retry reading file'}</Button>
        )}
      </div>
    </Dialog>
  );
}
