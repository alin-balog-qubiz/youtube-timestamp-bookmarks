import { useEffect, useId, useRef, useState } from 'react';

import { SearchInput } from './SearchInput';

export interface TransferVideo {
  id: string;
  title?: string;
  bookmarkCount: number;
}

export interface VideoSelectorProps {
  videos: readonly TransferVideo[];
  selectedVideoIds: readonly string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
  emptyMessage: string;
}

export function VideoSelector({
  videos, selectedVideoIds, onSelectionChange, disabled = false, emptyMessage,
}: VideoSelectorProps) {
  const [filter, setFilter] = useState('');

  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectAllId = useId();
  const selectedIds = new Set(selectedVideoIds);
  const selectedVideos = videos.filter((video) => selectedIds.has(video.id));
  const selectedBookmarks = selectedVideos.reduce((total, video) => total + video.bookmarkCount, 0);
  const allSelected = videos.length > 0 && selectedVideos.length === videos.length;
  const normalizedFilter = filter.toLowerCase();
  const visibleVideos = videos.filter((video) => !normalizedFilter ||
    video.title?.toLowerCase().includes(normalizedFilter));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedVideos.length > 0 && !allSelected;
    }
  }, [selectedVideos.length, allSelected]);

  function toggleVideo(id: string, checked: boolean) {
    if (disabled) return;

    const nextSelectedIds = new Set(selectedVideoIds);
    if (checked) nextSelectedIds.add(id);
    else nextSelectedIds.delete(id);
    onSelectionChange(videos.filter((video) => nextSelectedIds.has(video.id)).map((video) => video.id));
  }

  return (
    <section className="yb-video-selector" aria-label="Videos to transfer">
      <SearchInput
        label="Filter by video title"
        value={filter}
        onChange={setFilter}
        disabled={disabled || videos.length === 0}
        placeholder="Search video titles"
      />
      <div className="yb-video-selector-summary">
        <label className="yb-transfer-checkbox" htmlFor={selectAllId}>
          <input
            ref={selectAllRef}
            id={selectAllId}
            type="checkbox"
            checked={allSelected}
            disabled={disabled || videos.length === 0}
            onChange={(event) => onSelectionChange(event.currentTarget.checked ? videos.map((video) => video.id) : [])}
          />
          <span>Select all</span>
        </label>
        <p role="status">{selectedVideos.length} videos · {selectedBookmarks} bookmarks selected</p>
      </div>
      {videos.length === 0 ? (
        <p className="yb-dialog-help" role="status">{emptyMessage}</p>
      ) : visibleVideos.length === 0 ? (
        <p className="yb-dialog-help" role="status">No video titles match your search. Your selection is unchanged.</p>
      ) : (
        <ul className="yb-video-selector-list" aria-label="Available videos">
          {visibleVideos.map((video) => (
            <li key={video.id}>
              <label className="yb-transfer-checkbox yb-video-selector-row">
                <input
                  type="checkbox"
                  checked={selectedIds.has(video.id)}
                  disabled={disabled}
                  onChange={(event) => toggleVideo(video.id, event.currentTarget.checked)}
                />
                <span>
                  <strong>{video.title?.trim() || video.id}</strong>
                  <span className="yb-dialog-help">{video.bookmarkCount} {video.bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
