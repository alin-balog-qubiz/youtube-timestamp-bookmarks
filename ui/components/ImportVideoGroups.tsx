import type { ReactNode } from 'react';

import { formatTimestamp } from '@/utils/bookmark-time';

interface ImportDetail {
  videoId?: string;
  videoTitle?: string;
  timestamp?: number;
  location?: string;
}

interface ImportVideoGroupsProps<T extends ImportDetail> {
  items: readonly T[];
  renderItem?: (item: T) => ReactNode;
}

interface VideoDetailGroup<T> {
  key: string;
  videoId?: string;
  title?: string;
  location?: string;
  items: T[];
}

export function ImportVideoGroups<T extends ImportDetail>({ items, renderItem }: ImportVideoGroupsProps<T>) {
  const groups = groupVideoDetails(items);
  const labelCounts = new Map<string, number>();
  for (const group of groups) {
    const label = group.title || group.videoId || group.location || '';
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }

  return (
    <div className="yb-import-video-groups">
      {groups.map((group) => {
        const label = group.title || group.videoId || group.location;
        const showId = group.title && group.videoId && (labelCounts.get(label ?? '') ?? 0) > 1;

        return (
          <details className="yb-import-video-group" key={group.key}>
            <summary>
              <span>{label}</span>{' '}
              <span className="yb-import-group-count">({group.items.length})</span>
              {showId && <span className="yb-dialog-help">{group.videoId}</span>}
              {group.location && label !== group.location && <span className="yb-dialog-help">{group.location}</span>}
            </summary>
            <ul>
              {group.items.map((item, index) => (
                <li key={index}>
                  {item.timestamp !== undefined && <strong>{formatTimestamp(item.timestamp)}</strong>}
                  {renderItem?.(item)}
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function groupVideoDetails<T extends ImportDetail>(items: readonly T[]): VideoDetailGroup<T>[] {
  const groups = new Map<string, VideoDetailGroup<T>>();
  for (const item of items) {
    // Omission records with the same ID can be ambiguous; keep source records separate.
    const location = item.location?.split('.bookmarks[')[0];
    const key = JSON.stringify([item.videoId, location]);
    let group = groups.get(key);
    if (!group) {
      group = { key, videoId: item.videoId, location, items: [] };
      groups.set(key, group);
    }
    if (!group.title && item.videoTitle?.trim()) group.title = item.videoTitle;
    group.items.push(item);
  }

  for (const group of groups.values())
    group.items.sort((left, right) => (left.timestamp ?? Number.MAX_VALUE) - (right.timestamp ?? Number.MAX_VALUE));

  return Array.from(groups.values());
}
