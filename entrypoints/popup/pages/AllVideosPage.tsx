import { useEffect, useMemo, useRef, useState } from 'react';
import { browser } from 'wxt/browser';

import { deleteVideoBookmarks } from '@/services/bookmark-client';
import { listVideos } from '@/services/bookmarks';
import { getMarkerPreferences } from '@/services/marker-preferences';
import { openBookmark } from '@/services/player-navigation';

import type { ActiveTabContext } from '@/models/active-tab';
import type { Video } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

import { Button, ConfirmationDialog, EmptyState, ErrorState, Link, Notice, SearchInput, Skeleton, Toast, VideoGroup } from '@/ui';

interface AllVideosPageProps {
  activeTabContext: ActiveTabContext;
}

interface LibraryState {
  status: 'loading' | 'ready' | 'error';
  videos: Video[];
  preferences: MarkerPreferences | null;
  error: string | null;
}

interface VideoDeletion {
  videoId: string;
  title: string;
  count: number;
}

export default function AllVideosPage({ activeTabContext }: AllVideosPageProps) {
  const [libraryState, setLibraryState] = useState<LibraryState>({
    status: 'loading',
    videos: [],
    preferences: null,
    error: null,
  });
  const [query, setQuery] = useState('');
  const [retryId, setRetryId] = useState(0);
  const [deletion, setDeletion] = useState<VideoDeletion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [expandedVideoIds, setExpandedVideoIds] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  const latestRefreshIdRef = useRef(0);
  const latestPlaybackIdRef = useRef(0);
  const isDisposedRef = useRef(false);
  const refreshLibraryRef = useRef<(() => Promise<void>) | null>(null);

  const orderedVideos = useMemo(() => libraryState.videos.map((video) => {
    const bookmarks = Object.values(video.bookmarks).sort((first, second) => first.timestamp - second.timestamp);
    const newestCreatedAt = bookmarks.reduce((newest, bookmark) => Math.max(newest, Date.parse(bookmark.createdAt)), 0);

    return { video, bookmarks, newestCreatedAt };
  }).sort((first, second) => second.newestCreatedAt - first.newestCreatedAt), [libraryState.videos]);

  useEffect(() => {
    isDisposedRef.current = false;

    return () => {
      isDisposedRef.current = true;
      latestPlaybackIdRef.current++;
    };
  }, []);

  useEffect(() => {
    let isReadDisposed = false;
    refreshLibraryRef.current = refreshLibrary;

    browser.storage.onChanged.addListener(handleStorageChanged);
    void refreshLibrary();

    return () => {
      isReadDisposed = true;
      latestRefreshIdRef.current++;
      refreshLibraryRef.current = null;
      browser.storage.onChanged.removeListener(handleStorageChanged);
    };

    function handleStorageChanged(changes: Record<string, unknown>, areaName: string) {
      if (areaName === 'local' && Object.keys(changes).some((key) => (
        key.startsWith('videos:v1:') || key === 'marker-preferences:v1'
      ))) {
        void refreshLibrary();
      }
    }

    async function refreshLibrary() {
      const refreshId = ++latestRefreshIdRef.current;

      try {
        const [videos, preferences] = await Promise.all([listVideos(), getMarkerPreferences()]);
        if (isReadDisposed || refreshId !== latestRefreshIdRef.current) return;

        setLibraryState({ status: 'ready', videos, preferences, error: null });
      } catch (failure) {
        if (isReadDisposed || refreshId !== latestRefreshIdRef.current) return;

        setLibraryState((currentState) => ({
          ...currentState,
          status: 'error',
          error: failure instanceof Error ? failure.message : 'Unable to read saved videos or marker preferences.',
        }));
      }
    }
  }, [retryId]);

  async function playBookmark(videoId: string, timestamp: number) {
    const playbackId = ++latestPlaybackIdRef.current;
    setPlaybackError(null);

    try {
      await openBookmark(videoId, timestamp);
    } catch (failure) {
      if (!isDisposedRef.current && playbackId === latestPlaybackIdRef.current) {
        setPlaybackError(failure instanceof Error ? failure.message : 'Unable to open this bookmark.');
      }
    }
  }

  async function goToVideo(videoId: string) {
    const playbackId = ++latestPlaybackIdRef.current;
    setPlaybackError(null);

    try {
      await browser.tabs.create({ url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` });
    } catch (failure) {
      if (!isDisposedRef.current && playbackId === latestPlaybackIdRef.current) {
        setPlaybackError(failure instanceof Error ? failure.message : 'Unable to open this video.');
      }
    }
  }

  async function confirmDeletion() {
    if (!deletion || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteVideoBookmarks(deletion.videoId);
      if (isDisposedRef.current) return;

      setDeletion(null);
      setFeedback('Saved video deleted.');
      // Read again rather than hiding a concurrent quick add after the deletion.
      void refreshLibraryRef.current?.();
    } catch (failure) {
      if (!isDisposedRef.current) {
        setDeleteError(failure instanceof Error ? failure.message : 'Unable to delete bookmarks. Please retry.');
      }
    } finally {
      if (!isDisposedRef.current) setIsDeleting(false);
    }
  }

  const normalizedQuery = query.toLowerCase();
  const matchingVideos = orderedVideos.filter(({ video }) => (
    normalizedQuery === '' || !!video.title?.toLowerCase().includes(normalizedQuery)
  ));
  const preferences = libraryState.preferences;

  return (
    <>
      <h1 className="yb-sr-only">All videos</h1>
      <SearchInput label="Filter by video title" labelHidden value={query} onChange={setQuery} placeholder="Search saved titles" />

      {libraryState.status === 'loading' && <Skeleton label="Loading saved videos" />}
      {libraryState.status === 'error' && (
        <ErrorState title="Unable to load saved videos" onRetry={() => setRetryId((currentId) => currentId + 1)}>
          {libraryState.error}
        </ErrorState>
      )}
      {libraryState.status === 'ready' && orderedVideos.length === 0 && (
        <EmptyState title="No saved videos yet">
          {activeTabContext.status === 'supported' ? (
            <>Use the <strong>+</strong> button in the YouTube player to save a moment.</>
          ) : (
            <>Open a video on <Link href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</Link> and use the player <strong>+</strong> button to save a moment.</>
          )}
        </EmptyState>
      )}
      {libraryState.status === 'ready' && orderedVideos.length > 0 && matchingVideos.length === 0 && (
        <EmptyState title="No matching videos" action={<Button onClick={() => setQuery('')}>Clear search</Button>}>
          No saved titles match this search.
        </EmptyState>
      )}
      {preferences && matchingVideos.length > 0 && (
        <div className="yb-video-list">
          {matchingVideos.map(({ video, bookmarks }) => (
            <VideoGroup
              key={video.id}
              videoId={video.id}
              title={video.title}
              bookmarks={bookmarks.map((bookmark) => ({ ...bookmark, id: String(bookmark.timestamp) }))}
              defaultChoice={preferences.defaultColor}
              expanded={expandedVideoIds.has(video.id)}
              onExpandedChange={(expanded) => {
                setExpandedVideoIds((currentIds) => {
                  const updatedIds = new Set(currentIds);
                  if (expanded) updatedIds.add(video.id);
                  else updatedIds.delete(video.id);
                  return updatedIds;
                });
              }}
              onGoToVideo={() => void goToVideo(video.id)}
              onSeek={(bookmark) => void playBookmark(video.id, bookmark.timestamp)}
              onDeleteVideo={() => {
                setDeleteError(null);
                setDeletion({ videoId: video.id, title: video.title || video.id, count: bookmarks.length });
              }}
            />
          ))}
        </div>
      )}
      {playbackError && <Notice variant="error">{playbackError}</Notice>}
      <Toast message={feedback} onDismiss={() => setFeedback(null)} />

      {deletion && (
        <ConfirmationDialog
          open
          title="Delete video?"
          pending={isDeleting}
          error={deleteError ?? undefined}
          onClose={() => setDeletion(null)}
          onConfirm={() => void confirmDeletion()}
          confirmLabel="Delete video"
        >
          <p>Delete <strong>{deletion.title}</strong> ({deletion.videoId}) and its <strong>{deletion.count} saved {deletion.count === 1 ? 'bookmark' : 'bookmarks'}</strong>?</p>
          <p>Only this video's saved data is removed. The YouTube source is unaffected. This cannot be undone.</p>
        </ConfirmationDialog>
      )}
    </>
  );
}
