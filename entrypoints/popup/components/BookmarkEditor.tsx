import { useEffect, useRef, useState } from 'react';

import { getActiveTabContext } from '@/services/active-tab';
import { updateBookmark } from '@/services/bookmark-client';
import { getPlayerDuration } from '@/services/player-navigation';
import { canAdjustTimestamp } from '@/utils/bookmark-time';

import type { ActiveTabContext } from '@/models/active-tab';
import type { Bookmark, Video } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

import { BookmarkEditor as EditorDialog, type ColorChoice } from '@/ui';

interface BookmarkEditorProps {
  readonly bookmark: Bookmark;
  readonly videoId: string;
  readonly tabId: number;
  readonly activeTabContext: ActiveTabContext;
  readonly preferences: MarkerPreferences;
  readonly onSaved: (video: Video) => void;
  readonly onDismiss: () => void;
}

const contextChangedMessage = 'The active video changed or became unavailable. Close this dialog and reopen Edit in the correct video to save.';

export default function BookmarkEditor(props: BookmarkEditorProps) {
  const { bookmark, videoId, tabId, activeTabContext, preferences, onSaved, onDismiss } = props;

  const [draftTimestamp, setDraftTimestamp] = useState(bookmark.timestamp);
  const [draftName, setDraftName] = useState(bookmark.name ?? '');
  const [draftColor, setDraftColor] = useState<ColorChoice | undefined>(bookmark.color);

  const [playerDuration, setPlayerDuration] = useState<number | null>(null);
  const [isReadingDuration, setIsReadingDuration] = useState(true);

  const [isContextInvalidated, setIsContextInvalidated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditorDisposedRef = useRef(false);
  const isContextInvalidatedRef = useRef(false);
  const latestActiveTabContextRef = useRef(activeTabContext);

  latestActiveTabContextRef.current = activeTabContext;

  if (!matchesContext(activeTabContext, videoId, tabId))
    isContextInvalidatedRef.current = true;

  useEffect(() => {
    isEditorDisposedRef.current = false;

    return () => {
      isEditorDisposedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (isContextInvalidatedRef.current)
      setIsContextInvalidated(true);
  }, [activeTabContext]);

  useEffect(() => {
    let isDurationDisposed = false;
    void readDuration();

    return () => {
      isDurationDisposed = true;
    };

    async function readDuration() {
      try {
        const duration = await getPlayerDuration(tabId, videoId);
        if (!isDurationDisposed)
          setPlayerDuration(getFiniteDuration(duration));
      } catch {
        if (!isDurationDisposed)
          setPlayerDuration(null);
      } finally {
        if (!isDurationDisposed)
          setIsReadingDuration(false);
      }
    }
  }, [tabId, videoId]);

  async function save() {
    if (isSaving || isContextInvalidatedRef.current)
      return;

    setIsSaving(true);
    setSaveError(null);

    try {
      if (!(await validateSaveContext()))
        return;

      if (!(await validateTimestampChange()))
        return;

      if (isEditorDisposedRef.current || !isEditContextCurrent())
        return;

      const updatedVideo = await updateBookmark(videoId, bookmark.timestamp, {
        timestamp: draftTimestamp,
        name: draftName.trim() || undefined,
        color: draftColor,
      }, tabId);
      if (!isEditorDisposedRef.current)
        onSaved(updatedVideo);
    } catch (error) {
      if (!isEditorDisposedRef.current)
        setSaveError(error instanceof Error ? error.message : 'Unable to save the bookmark. Please retry.');
    } finally {
      if (!isEditorDisposedRef.current)
        setIsSaving(false);
    }
  }

  async function validateSaveContext(): Promise<boolean> {
    const freshContext = await getActiveTabContext();
    if (isEditorDisposedRef.current)
      return false;

    if (matchesContext(freshContext, videoId, tabId) && isEditContextCurrent())
      return true;

    isContextInvalidatedRef.current = true;
    setIsContextInvalidated(true);

    return false;
  }

  async function validateTimestampChange(): Promise<boolean> {
    if (draftTimestamp === bookmark.timestamp)
      return true;

    const duration = await getPlayerDuration(tabId, videoId).catch((failure: unknown) => {
      if (!isEditorDisposedRef.current)
        setPlayerDuration(null);

      throw failure;
    });
    if (isEditorDisposedRef.current)
      return false;

    const freshDuration = getFiniteDuration(duration);
    setPlayerDuration(freshDuration);
    if (freshDuration === null) {
      setSaveError('The player duration is unavailable. Retry when the video is ready, or cancel and reopen to edit only name and color.');
      return false;
    }

    if (!canAdjustTimestamp(draftTimestamp, 0, freshDuration)) {
      setSaveError('This timestamp is outside the current player duration. Adjust it before saving.');
      return false;
    }

    return true;
  }

  function isEditContextCurrent(): boolean {
    return !isContextInvalidatedRef.current &&
      matchesContext(latestActiveTabContextRef.current, videoId, tabId);
  }

  const draft = { timestamp: draftTimestamp, name: draftName, color: draftColor };
  const isBlocked = isContextInvalidated || isContextInvalidatedRef.current;

  return (
    <EditorDialog
      open
      onClose={onDismiss}
      draft={draft}
      onDraftChange={(updatedDraft) => {
        setDraftTimestamp(updatedDraft.timestamp);
        setDraftName(updatedDraft.name);
        setDraftColor(updatedDraft.color);
      }}
      onSave={() => void save()}
      maxTimestamp={isReadingDuration ? null : playerDuration}
      originalTimestamp={bookmark.timestamp}
      defaultChoice={preferences.defaultColor}
      pending={isSaving}
      error={saveError ?? undefined}
      contextError={isBlocked ? contextChangedMessage : undefined}
    />
  );
}

function matchesContext(context: ActiveTabContext, videoId: string, tabId: number): boolean {
  return context.status === 'supported' && context.tabId === tabId && context.video.videoId === videoId;
}

function getFiniteDuration(duration: number | null): number | null {
  if (duration === null || !Number.isFinite(duration) || duration < 0)
    return null;

  return duration;
}
