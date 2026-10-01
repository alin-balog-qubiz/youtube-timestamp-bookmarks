import { useEffect, useMemo, useRef, useState } from 'react';
import { browser } from 'wxt/browser';

import { deleteVideoBookmarks } from '@/services/bookmark-client';
import { listVideos } from '@/services/bookmarks';
import { getMarkerPreferences, resolveBookmarkColor } from '@/services/marker-preferences';
import { openBookmark } from '@/services/player-navigation';
import { formatTimestamp } from '@/utils/bookmark-time';

import type { ActiveTabContext } from '@/models/active-tab';
import type { Video } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

import PopupDialog from '../components/PopupDialog';

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

  async function confirmDeletion() {
    if (!deletion || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteVideoBookmarks(deletion.videoId);
      if (isDisposedRef.current) return;

      setDeletion(null);
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
      <h1 id="page-heading" aria-live="polite">All videos</h1>

      <div className="video-search">
        <label htmlFor="video-title-search">Filter by video title</label>
        <div className="video-search-controls">
          <input
            id="video-title-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved titles"
          />
          {query !== '' && <button type="button" onClick={() => setQuery('')}>Clear search</button>}
        </div>
      </div>

      {libraryState.status === 'loading' && <p role="status">Loading saved videos…</p>}

      {libraryState.status === 'error' && (
        <div className="read-error">
          <p className="error" role="alert">{libraryState.error}</p>
          <button type="button" onClick={() => setRetryId((currentId) => currentId + 1)}>Retry</button>
        </div>
      )}

      {libraryState.status === 'ready' && orderedVideos.length === 0 && (
        <p>
          No saved videos yet. {activeTabContext.status === 'supported' ? (
            <>Use the <strong>+</strong> button in the YouTube player to save a moment.</>
          ) : (
            <>Open a video on <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a> and use the player <strong>+</strong> button to save a moment.</>
          )}
        </p>
      )}

      {libraryState.status === 'ready' && orderedVideos.length > 0 && matchingVideos.length === 0 && (
        <p role="status">No matching videos. Clear the search to show all saved videos.</p>
      )}

      {preferences && matchingVideos.length > 0 && (
        <ul className="video-list">
          {matchingVideos.map(({ video, bookmarks }) => {
            const title = video.title || video.id;

            return (
              <li key={video.id} className="saved-video">
                <a
                  className="saved-video-title"
                  href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {title}
                </a>
                <div className="bookmark-toolbar">
                  <span>{bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDeletion({ videoId: video.id, title, count: bookmarks.length });
                    }}
                  >
                    Delete all bookmarks
                  </button>
                </div>
                <details className="video-moments">
                  <summary aria-label={`Show bookmarks for ${title}`}>Saved moments</summary>
                  <ul className="bookmark-list">
                    {bookmarks.map((bookmark) => {
                      const resolvedColor = resolveBookmarkColor(bookmark, preferences);

                      return (
                        <li key={bookmark.timestamp} className="bookmark-row">
                          <span
                            className="color-swatch"
                            style={{ backgroundColor: resolvedColor }}
                            role="img"
                            aria-label={`${resolvedColor}${bookmark.color ? '' : ' (default)'} marker`}
                          />
                          <button
                            type="button"
                            className="timestamp-link"
                            aria-label={`Play ${title} at ${formatTimestamp(bookmark.timestamp)}`}
                            onClick={() => void playBookmark(video.id, bookmark.timestamp)}
                          >
                            {formatTimestamp(bookmark.timestamp)}
                          </button>
                          <span className="bookmark-name">{bookmark.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {playbackError && <p className="error" role="alert">{playbackError}</p>}

      {deletion && (
        <PopupDialog
          labelledBy="delete-video-bookmarks-heading"
          busy={isDeleting}
          onDismiss={() => setDeletion(null)}
        >
          <h2 id="delete-video-bookmarks-heading">Delete all bookmarks?</h2>
          <p>Delete all <strong>{deletion.count} {deletion.count === 1 ? 'bookmark' : 'bookmarks'}</strong> for <strong>{deletion.title}</strong>?</p>
          <p className="help">This cannot be undone.</p>
          {deleteError && <p className="error" role="alert">{deleteError}</p>}

          <div className="dialog-actions">
            <button type="button" autoFocus disabled={isDeleting} onClick={() => setDeletion(null)}>Cancel</button>
            <button
              type="button"
              className="destructive"
              disabled={isDeleting}
              onClick={() => void confirmDeletion()}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </PopupDialog>
      )}
    </>
  );
}
