import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';

import { deleteBookmark, deleteVideoBookmarks, getVideo } from '@/services/bookmark-client';
import { getMarkerPreferences, resolveBookmarkColor } from '@/services/marker-preferences';
import { getBookmarkUrl, seekBookmark } from '@/services/player-navigation';
import { formatTimestamp } from '@/utils/bookmark-time';

import type { ActiveTabContext } from '@/models/active-tab';
import type { Bookmark, Video } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

import BookmarkEditor from '../components/BookmarkEditor';
import PopupDialog from '../components/PopupDialog';

interface ThisVideoPageProps {
  activeTabContext: ActiveTabContext;
}

interface SavedVideoState {
  videoId: string | null;
  status: 'loading' | 'ready' | 'error';
  video: Video | null;
  preferences: MarkerPreferences | null;
  error: string | null;
}

type OpenDialog =
  | { type: 'edit'; videoId: string; tabId: number; bookmark: Bookmark; preferences: MarkerPreferences }
  | { type: 'delete'; videoId: string; title: string; bookmark: Bookmark }
  | { type: 'delete-all'; videoId: string; title: string; count: number };

export default function ThisVideoPage({ activeTabContext }: ThisVideoPageProps) {
  const [savedState, setSavedState] = useState<SavedVideoState>({
    videoId: null,
    status: 'loading',
    video: null,
    preferences: null,
    error: null,
  });
  const [retryId, setRetryId] = useState(0);
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const latestRefreshIdRef = useRef(0);
  const latestVideoIdRef = useRef<string | null>(null);
  const latestActionIdRef = useRef(0);
  const isDisposedRef = useRef(false);
  const refreshSavedVideoRef = useRef<(() => Promise<void>) | null>(null);

  const videoId = activeTabContext.status === 'supported' ? activeTabContext.video.videoId : null;
  latestVideoIdRef.current = videoId;

  useEffect(() => {
    isDisposedRef.current = false;

    return () => {
      isDisposedRef.current = true;
      latestRefreshIdRef.current++;
      latestActionIdRef.current++;
    };
  }, []);

  useEffect(() => {
    let isReadDisposed = false;

    setFeedback(null);
    latestActionIdRef.current++;

    if (!videoId) {
      latestRefreshIdRef.current++;

      return;
    }

    const requestedVideoId = videoId;
    const videoStorageKey = `videos:v1:${encodeURIComponent(videoId)}`;

    refreshSavedVideoRef.current = refreshSavedVideo;

    browser.storage.onChanged.addListener(handleStorageChanged);
    void refreshSavedVideo();

    return () => {
      isReadDisposed = true;
      latestRefreshIdRef.current++;
      refreshSavedVideoRef.current = null;
      browser.storage.onChanged.removeListener(handleStorageChanged);
    };

    function handleStorageChanged(changes: Record<string, unknown>, areaName: string) {
      if (areaName === 'local' && (videoStorageKey in changes || 'marker-preferences:v1' in changes)) {
        void refreshSavedVideo();
      }
    }

    async function refreshSavedVideo() {
      const refreshId = ++latestRefreshIdRef.current;

      setSavedState((currentState) => currentState.videoId === videoId && currentState.preferences ? currentState : {
        videoId,
        status: 'loading',
        video: null,
        preferences: null,
        error: null,
      });

      try {
        const [video, preferences] = await Promise.all([getVideo(requestedVideoId), getMarkerPreferences()]);
        if (isReadDisposed || refreshId !== latestRefreshIdRef.current) return;

        setSavedState({ videoId, status: 'ready', video, preferences, error: null });
      } catch (failure) {
        if (isReadDisposed || refreshId !== latestRefreshIdRef.current) return;

        setSavedState((currentState) => ({
          ...currentState,
          status: 'error',
          error: failure instanceof Error ? failure.message : 'Unable to read saved bookmarks or marker preferences.',
        }));
      }
    }
  }, [videoId, retryId]);

  async function playBookmark(bookmark: Bookmark) {
    if (activeTabContext.status !== 'supported') return;

    const actionId = ++latestActionIdRef.current;
    setFeedback(null);

    try {
      await seekBookmark(activeTabContext.tabId, activeTabContext.video.videoId, bookmark.timestamp);
    } catch (failure) {
      if (!isDisposedRef.current && actionId === latestActionIdRef.current) {
        setFeedback({
          error: true,
          message: failure instanceof Error ? failure.message : 'Unable to seek to this bookmark.',
        });
      }
    }
  }

  async function copyBookmarkLink(bookmark: Bookmark) {
    if (!videoId) return;

    const actionId = ++latestActionIdRef.current;
    setFeedback(null);

    try {
      await navigator.clipboard.writeText(getBookmarkUrl(videoId, bookmark.timestamp));
      if (!isDisposedRef.current && actionId === latestActionIdRef.current) {
        setFeedback({
          error: false,
          message: `Copied the link for ${formatTimestamp(bookmark.timestamp)}.`,
        });
      }
    } catch (failure) {
      if (!isDisposedRef.current && actionId === latestActionIdRef.current) {
        setFeedback({
          error: true,
          message: `Unable to copy the link. ${failure instanceof Error ? failure.message : 'Please retry.'}`,
        });
      }
    }
  }

  async function confirmDeletion() {
    if (!dialog || dialog.type === 'edit' || isDeleting) return;

    const deletion = dialog;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (deletion.type === 'delete') {
        await deleteBookmark(deletion.videoId, deletion.bookmark.timestamp);
      } else {
        await deleteVideoBookmarks(deletion.videoId);
      }

      refreshSavedVideoAfterMutation(deletion.videoId);

      if (!isDisposedRef.current) {
        setDialog(null);

        if (latestVideoIdRef.current === deletion.videoId) {
          setFeedback({
            error: false,
            message: deletion.type === 'delete' ? 'Bookmark deleted.' : 'All bookmarks deleted.',
          });
        }
      }
    } catch (failure) {
      if (!isDisposedRef.current) {
        setDeleteError(failure instanceof Error ? failure.message : 'Unable to delete bookmarks. Please retry.');
      }
    } finally {
      if (!isDisposedRef.current) setIsDeleting(false);
    }
  }

  function refreshSavedVideoAfterMutation(mutatedVideoId: string) {
    if (isDisposedRef.current || latestVideoIdRef.current !== mutatedVideoId)
      return;

    // A mutation response may predate a later quick add; read the authoritative record.
    void refreshSavedVideoRef.current?.();
  }

  const hasCurrentRead = savedState.videoId === videoId;
  const preferences = savedState.preferences;
  const savedVideo = hasCurrentRead ? savedState.video : null;
  const activeVideoTitle = activeTabContext.status === 'supported' ? activeTabContext.video.title : undefined;
  const title = savedVideo?.title || activeVideoTitle || videoId;
  const bookmarks = savedVideo
    ? Object.values(savedVideo.bookmarks).sort((first, second) => first.timestamp - second.timestamp)
    : [];

  return (
    <>
      <h1 id="this-video-heading" aria-live="polite">This video</h1>
      {videoId && <p className="video-title">{title}</p>}

      {!videoId ? <p>This video is available on a supported YouTube watch page.</p> : (
        <>
          {(!hasCurrentRead || savedState.status === 'loading') && <p role="status">Loading saved bookmarks…</p>}

          {hasCurrentRead && savedState.status === 'error' && (
            <div className="read-error">
              <p className="error" role="alert">{savedState.error}</p>
              <button type="button" onClick={() => setRetryId((currentId) => currentId + 1)}>Retry</button>
            </div>
          )}

          {hasCurrentRead && preferences && (
            <>
              {bookmarks.length === 0 && savedState.status === 'ready' ? (
                <p>No bookmarks saved for this video yet. Use the <strong>+</strong> button in the YouTube player to save a moment.</p>
              ) : bookmarks.length > 0 && (
                <>
                  <div className="bookmark-toolbar">
                    <span>{bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDialog({ type: 'delete-all', videoId, title: title || videoId, count: bookmarks.length });
                      }}
                    >
                      Delete all bookmarks
                    </button>
                  </div>

                  <ul className="bookmark-list">
                    {bookmarks.map((bookmark) => {
                      const resolvedColor = resolveBookmarkColor(bookmark, preferences);
                      const identity = `${formatTimestamp(bookmark.timestamp)}${bookmark.name ? ` — ${bookmark.name}` : ''}`;

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
                            aria-label={`Seek to ${formatTimestamp(bookmark.timestamp)}`}
                            onClick={() => void playBookmark(bookmark)}
                          >
                            {formatTimestamp(bookmark.timestamp)}
                          </button>
                          <span className="bookmark-name">{bookmark.name}</span>

                          <details className="row-actions">
                            <summary aria-label={`Actions for ${identity}`}>Actions</summary>
                            <div
                              className="row-action-list"
                              onClick={(event) => {
                                if (!(event.target instanceof HTMLElement) || !event.target.closest('button')) return;

                                const actionsElement = event.currentTarget.closest('details');
                                actionsElement?.removeAttribute('open');
                                actionsElement?.querySelector('summary')?.focus();
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeTabContext.status === 'supported') {
                                    setDialog({ type: 'edit', videoId, tabId: activeTabContext.tabId, bookmark, preferences });
                                  }
                                }}
                              >
                                Edit
                              </button>
                              <button type="button" onClick={() => void copyBookmarkLink(bookmark)}>Copy timestamped link</button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDialog({ type: 'delete', videoId, title: title || videoId, bookmark });
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </>
          )}

          {feedback && (
            <p className={feedback.error ? 'error' : 'feedback'} role={feedback.error ? 'alert' : 'status'}>
              {feedback.message}
            </p>
          )}
        </>
      )}

      {dialog?.type === 'edit' && (
        <BookmarkEditor
          bookmark={dialog.bookmark}
          videoId={dialog.videoId}
          tabId={dialog.tabId}
          activeTabContext={activeTabContext}
          preferences={preferences ?? dialog.preferences}
          onDismiss={() => setDialog(null)}
          onSaved={() => {
            refreshSavedVideoAfterMutation(dialog.videoId);
            setDialog(null);

            if (latestVideoIdRef.current === dialog.videoId) setFeedback({ error: false, message: 'Bookmark saved.' });
          }}
        />
      )}

      {dialog && dialog.type !== 'edit' && (
        <PopupDialog
          labelledBy="delete-bookmarks-heading"
          busy={isDeleting}
          onDismiss={() => setDialog(null)}
        >
          <h2 id="delete-bookmarks-heading">{dialog.type === 'delete' ? 'Delete bookmark?' : 'Delete all bookmarks?'}</h2>

          {dialog.type === 'delete' ? (
            <p>Delete <strong>{formatTimestamp(dialog.bookmark.timestamp)}{dialog.bookmark.name ? ` — ${dialog.bookmark.name}` : ''}</strong> from {dialog.title}?</p>
          ) : (
            <p>Delete all <strong>{dialog.count} {dialog.count === 1 ? 'bookmark' : 'bookmarks'}</strong> for <strong>{dialog.title}</strong>?</p>
          )}

          <p className="help">This cannot be undone.</p>
          {deleteError && <p className="error" role="alert">{deleteError}</p>}

          <div className="dialog-actions">
            <button
              type="button"
              autoFocus
              disabled={isDeleting}
              onClick={() => setDialog(null)}
            >
              Cancel
            </button>
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
