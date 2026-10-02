import { useEffect, useRef, useState } from 'react';

import type { BookmarkDraft, BookmarkItem, ColorChoice, PopupPage } from '@/ui';

import {
  BookmarkEditor, BookmarkRow, Button, ColorPicker, ConfirmationDialog, EmptyState,
  ErrorState, Icon, ImportPreview, Notice, PopupHeader, SearchInput, SectionHeader, SegmentedChoice,
  SettingGroup, SettingRow, Skeleton, Surface, Switch, ThemeChoice,
  Toast, VideoGroup, VideoSummary, useTheme,
} from '@/ui';

import { sampleBookmarks, sampleDefaultColor, sampleImportBookmarks, sampleIncoming, sampleVideos, sampleVideoTitle } from './fixtures';

interface PopupPreviewProps {
  readonly constrained: boolean;
  readonly manyRows: boolean;
  readonly longText: boolean;
}

export function PopupPreview({ constrained, manyRows, longText }: PopupPreviewProps) {
  const [selectedPage, setSelectedPage] = useState<PopupPage>('this-video');
  const [bookmarks, setBookmarks] = useState<readonly BookmarkItem[]>(sampleBookmarks);
  const [defaultChoice, setDefaultChoice] = useState<ColorChoice>(sampleDefaultColor);
  const [markersVisible, setMarkersVisible] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedVideos, setExpandedVideos] = useState<readonly string[]>(['practical-effects']);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookmarkDraft>({ name: '', timestamp: 0 });
  const [deletion, setDeletion] = useState<{ type: 'bookmark' | 'video'; id: string; name: string; count: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, setPending] = useState(false);
  const [operationError, setOperationError] = useState<string | undefined>();
  const [failNext, setFailNext] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [listState, setListState] = useState('ready');
  const [removedVideos, setRemovedVideos] = useState<readonly string[]>([]);

  const operationTimeoutRef = useRef<number | undefined>(undefined);

  const { preference, setPreference } = useTheme();

  useEffect(() => () => clearTimeout(operationTimeoutRef.current), []);

  useEffect(() => {
    setBookmarks((current) => {
      const regularBookmarks = current.filter((bookmark) => !bookmark.id.startsWith('extra-'));
      if (!manyRows) return regularBookmarks;

      return [...regularBookmarks, ...Array.from({ length: 24 }, (_, index): BookmarkItem => ({
        id: `extra-${index}`, timestamp: 970 + index * 5, name: `Additional sample bookmark ${index + 1}`,
      }))].sort((first, second) => first.timestamp - second.timestamp);
    });
  }, [manyRows]);

  function performOperation(commit: () => void) {
    if (pending) return;
    setOperationError(undefined);
    setPending(true);
    operationTimeoutRef.current = window.setTimeout(() => {
      setPending(false);
      if (failNext) {
        setFailNext(false);
        setOperationError('Sample operation failed. Your draft is unchanged; retry to continue.');
        return;
      }
      commit();
    }, 700);
  }

  function editBookmark(bookmark: BookmarkItem) {
    setDraft({ name: bookmark.name ?? '', timestamp: bookmark.timestamp, color: bookmark.color });
    setOperationError(undefined);
    setEditorId(bookmark.id);
  }

  function saveBookmark() {
    if (bookmarks.some((bookmark) => bookmark.id !== editorId && bookmark.timestamp === draft.timestamp)) {
      setOperationError('A sample bookmark already exists at this second. Choose another timestamp.');
      return;
    }
    performOperation(() => {
      setBookmarks((current) => current.map((bookmark) => bookmark.id === editorId
        ? { ...bookmark, name: draft.name.trim() || undefined, timestamp: draft.timestamp, color: draft.color }
        : bookmark).sort((first, second) => first.timestamp - second.timestamp));
      setEditorId(null);
      setToast('Sample bookmark saved');
    });
  }

  function confirmDeletion() {
    if (!deletion) return;
    performOperation(() => {
      if (deletion.type === 'bookmark') {
        setBookmarks((current) => current.filter((bookmark) => bookmark.id !== deletion.id));
      } else {
        setRemovedVideos((current) => [...current, deletion.id]);
        if (deletion.id === 'practical-effects') setBookmarks([]);
      }
      setDeletion(null);
      setToast('Sample bookmarks deleted');
    });
  }

  function confirmImport() {
    performOperation(() => {
      setBookmarks((current) => importMode === 'replace' ? sampleImportBookmarks
        : [...current, ...sampleImportBookmarks.filter((item) => !current.some((existing) => existing.timestamp === item.timestamp))]
          .sort((first, second) => first.timestamp - second.timestamp));
      setRemovedVideos((current) => importMode === 'replace' ? ['sound-design'] : current.filter((id) => id !== 'practical-effects'));
      if (importMode === 'replace') {
        setDefaultChoice({ type: 'preset', preset: 'gray' });
        setMarkersVisible(false);
        setPreference('dark');
      }
      setImportOpen(false);
      setToast(`Sample ${importMode === 'merge' ? 'merge' : 'replacement'} complete; production library untouched`);
    });
  }

  const title = longText
    ? 'Why Practical Effects Still Matter in Modern Movies — an intentionally long title demonstrating wrapping without hiding navigation or actions'
    : sampleVideoTitle;
  const renderedBookmarks = bookmarks;
  const currentVideos = sampleVideos.filter((video) => !removedVideos.includes(video.id) && (video.id !== 'practical-effects' || bookmarks.length > 0));
  const visibleVideos = currentVideos.filter((video) => video.title.toLowerCase().includes(search.toLowerCase()));
  const duplicateCount = sampleImportBookmarks.filter((incoming) => bookmarks.some((bookmark) => bookmark.timestamp === incoming.timestamp)).length;
  const settingsChanges = [
    `Appearance: ${preference} → Dark`,
    `Default marker color: ${defaultChoice.type === 'preset' ? defaultChoice.preset : defaultChoice.value} → Gray`,
    `Player markers: ${markersVisible ? 'shown' : 'hidden'} → hidden`,
  ];

  return (
    <div className={`gallery-popup${constrained ? ' gallery-popup-constrained' : ''}`} aria-label="Interactive sample popup">
      <PopupHeader selectedPage={selectedPage} hasActiveVideo onNavigate={setSelectedPage} idPrefix="preview" />
      <main className="gallery-popup-scroll">
        <section role="tabpanel" id="preview-panel-this-video" aria-labelledby="preview-tab-this-video" hidden={selectedPage !== 'this-video'}>
          {selectedPage === 'this-video' && (
            <>
              <VideoSummary videoId="practical-effects" title={title} bookmarkCount={renderedBookmarks.length} />
              <SectionHeader title="Saved bookmarks" level={3} />
              {listState === 'loading' ? <Skeleton rows={4} /> : listState === 'error'
                ? <ErrorState onRetry={() => setListState('ready')}>The sample library could not be read. Retry restores the example.</ErrorState>
                : listState === 'empty' || bookmarks.length === 0
                  ? <EmptyState title="No bookmarks yet">Save a moment using the + control beside the YouTube player controls.</EmptyState>
                  : <Surface className="gallery-bookmark-list">
                    {renderedBookmarks.map((bookmark) => <BookmarkRow key={bookmark.id}
                      bookmark={longText && bookmark.id === 'opening' ? { ...bookmark, name: 'A deliberately long bookmark name that stays readable, wraps, and leaves its action menu reachable at small widths' } : bookmark}
                      defaultChoice={defaultChoice} onSeek={() => setToast(`Sample seek: ${bookmark.timestamp}s`)}
                      onEdit={() => editBookmark(bookmark)} onCopy={() => setToast('Sample timestamp link copied (fixture feedback only)')}
                      onDelete={() => { setOperationError(undefined); setDeletion({ type: 'bookmark', id: bookmark.id, name: bookmark.name ?? 'Unnamed bookmark', count: 1 }); }} />)}
                  </Surface>}
              <Notice>Save new bookmarks from the + control beside the YouTube player controls.</Notice>
            </>
          )}
        </section>
        <section role="tabpanel" id="preview-panel-all-videos" aria-labelledby="preview-tab-all-videos" hidden={selectedPage !== 'all-videos'}>
          {selectedPage === 'all-videos' && (
            <>
              <SearchInput label="Search sample video titles" value={search} onChange={setSearch} placeholder="Filter video titles" />
              <SectionHeader title="All videos" metadata={`${visibleVideos.length} sample videos`} />
              {visibleVideos.length === 0 && <EmptyState title={search ? 'No matching videos' : 'No saved videos'}>
                {search ? 'Try another title or clear the search.' : 'Save a moment from a YouTube watch page.'}
              </EmptyState>}
              {visibleVideos.map((video) => <VideoGroup key={video.id} videoId={video.id} title={video.id === 'practical-effects' ? title : video.title}
                bookmarks={video.id === 'practical-effects' ? bookmarks : video.bookmarks} defaultChoice={defaultChoice}
                expanded={expandedVideos.includes(video.id)} onExpandedChange={(expanded) => setExpandedVideos((current) => expanded ? [...current, video.id] : current.filter((id) => id !== video.id))}
                onGoToVideo={() => setToast(`Sample navigation: ${video.title}`)}
                onDeleteVideo={() => { setOperationError(undefined); setDeletion({ type: 'video', id: video.id, name: video.title, count: video.id === 'practical-effects' ? bookmarks.length : video.bookmarks.length }); }}
                onSeek={(bookmark) => setToast(`Sample seek: ${bookmark.timestamp}s`)} />)}
            </>
          )}
        </section>
        <section role="tabpanel" id="preview-panel-settings" aria-labelledby="preview-tab-settings" hidden={selectedPage !== 'settings'}>
          {selectedPage === 'settings' && (
            <>
              <SettingGroup title="Appearance">
                <SettingRow label="Color theme" control={<ThemeChoice labelHidden />} />
              </SettingGroup>
              <SettingGroup title="Playback">
                <SettingRow label="Show player markers" control={<Switch label="Show sample player markers" labelHidden checked={markersVisible} onChange={setMarkersVisible} />} />
                <SettingRow label="Default marker color" control={<ColorPicker label="Default marker color" labelHidden value={defaultChoice} defaultChoice={sampleDefaultColor} onChange={(choice) => { if (choice) setDefaultChoice(choice); }} />} />
              </SettingGroup>
              <SettingGroup title="Backup">
                <SettingRow label="Export sample backup" control={<Button onClick={() => setToast(`Sample export: ${bookmarks.length} bookmarks`)}><Icon name="download" size="small" />Export sample</Button>} />
                <SettingRow label="Import sample backup" control={<Button onClick={() => { setImportMode('merge'); setAcknowledged(false); setOperationError(undefined); setImportOpen(true); }}><Icon name="upload" size="small" />Import sample</Button>} />
              </SettingGroup>
            </>
          )}
        </section>
        <div className="gallery-fixture-controls">
          <p className="yb-muted">Fixture controls — not part of the popup</p>
          <SegmentedChoice label="Sample list state" value={listState} onChange={setListState} options={[
            { value: 'ready', label: 'Ready' }, { value: 'loading', label: 'Loading' }, { value: 'empty', label: 'Empty' }, { value: 'error', label: 'Error' },
          ]} />
          <Switch label="Fail next sample commit" checked={failNext} onChange={setFailNext} />
        </div>
      </main>
      <BookmarkEditor open={editorId !== null} onClose={() => setEditorId(null)} draft={draft} onDraftChange={setDraft}
        onSave={saveBookmark} maxTimestamp={1100} defaultChoice={defaultChoice} pending={pending} error={operationError} />
      <ConfirmationDialog open={deletion !== null} onClose={() => setDeletion(null)} onConfirm={confirmDeletion}
        title={deletion?.type === 'video' ? 'Delete video bookmarks?' : 'Delete bookmark?'}
        description={deletion ? `${deletion.name} — ${deletion.count} sample bookmark${deletion.count === 1 ? '' : 's'}. The YouTube source is unaffected.` : ''}
        confirmLabel="Delete sample" pending={pending} error={operationError} />
      <ImportPreview open={importOpen} onClose={() => setImportOpen(false)} onConfirm={confirmImport} fileName="sample-backup.json"
        mode={importMode} onModeChange={(mode) => { setImportMode(mode); setAcknowledged(false); }}
        current={{ videos: currentVideos.length, bookmarks: currentVideos.reduce((total, video) => total + (video.id === 'practical-effects' ? bookmarks.length : video.bookmarks.length), 0) }} incoming={sampleIncoming}
        additions={sampleImportBookmarks.length - duplicateCount} duplicates={duplicateCount} settingsChanges={settingsChanges} acknowledged={acknowledged}
        onAcknowledgedChange={setAcknowledged} pending={pending} error={operationError} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
