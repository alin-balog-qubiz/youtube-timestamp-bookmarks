import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';

import { deleteBookmark, getVideo } from '@/services/bookmark-client';
import { getMarkerPreferences } from '@/services/marker-preferences';
import { getBookmarkUrl, seekBookmark } from '@/services/player-navigation';
import { formatTimestamp } from '@/utils/bookmark-time';

import type { ActiveTabContext } from '@/models/active-tab';
import type { Bookmark, Video } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

import BookmarkEditor from '../components/BookmarkEditor';
import { BookmarkRow, ConfirmationDialog, EmptyState, ErrorState, Notice, Skeleton, Toast, VideoSummary } from '@/ui';

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
  | { type: 'delete'; videoId: string; title: string; bookmark: Bookmark };

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
      await deleteBookmark(deletion.videoId, deletion.bookmark.timestamp);

      refreshSavedVideoAfterMutation(deletion.videoId);

      if (!isDisposedRef.current) {
        setDialog(null);

        if (latestVideoIdRef.current === deletion.videoId) {
          setFeedback({
            error: false,
            message: 'Bookmark deleted.',
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
      {!videoId ? (
        <Notice>This video is available on a supported YouTube watch page.</Notice>
      ) : (
        <>
          {(!hasCurrentRead || savedState.status === 'loading') && <Skeleton label="Loading saved bookmarks" />}
          {hasCurrentRead && savedState.status === 'error' && (
            <ErrorState onRetry={() => setRetryId((currentId) => currentId + 1)}>
              {savedState.error}
            </ErrorState>
          )}
          {hasCurrentRead && preferences && (
            <>
              <VideoSummary videoId={videoId} title={title || videoId} bookmarkCount={bookmarks.length} />
              {bookmarks.length === 0 && savedState.status === 'ready' ? (
                <EmptyState title="No bookmarks yet">
                  Use the <strong>+</strong> button in the YouTube player to save a moment.
                </EmptyState>
              ) : (
                <div className="yb-bookmark-list">
                  {bookmarks.map((bookmark) => (
                    <BookmarkRow
                      key={bookmark.timestamp}
                      bookmark={{ ...bookmark, id: String(bookmark.timestamp) }}
                      defaultChoice={preferences.defaultColor}
                      onSeek={() => void playBookmark(bookmark)}
                      onEdit={() => {
                        if (activeTabContext.status === 'supported') {
                          setDialog({ type: 'edit', videoId, tabId: activeTabContext.tabId, bookmark, preferences });
                        }
                      }}
                      onCopy={() => void copyBookmarkLink(bookmark)}
                      onDelete={() => {
                        setDeleteError(null);
                        setDialog({ type: 'delete', videoId, title: title || videoId, bookmark });
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {feedback?.error && <Notice variant="error">{feedback.message}</Notice>}
          <Toast message={feedback && !feedback.error ? feedback.message : null} onDismiss={() => setFeedback(null)} />
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

      {dialog?.type === 'delete' && (
        <ConfirmationDialog
          open
          title="Delete bookmark?"
          pending={isDeleting}
          error={deleteError ?? undefined}
          onClose={() => setDialog(null)}
          onConfirm={() => void confirmDeletion()}
          confirmLabel="Delete bookmark"
        >
          <p>Delete <strong>{formatTimestamp(dialog.bookmark.timestamp)} — {dialog.bookmark.name?.trim() || 'Unnamed bookmark'}</strong> from <strong>{dialog.title}</strong>?</p>
          <p>This removes the saved bookmark only. The YouTube video is unaffected. This cannot be undone.</p>
        </ConfirmationDialog>
      )}
    </>
  );
}
