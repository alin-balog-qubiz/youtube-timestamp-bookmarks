import type { BookmarkItem, ColorChoice } from '../utils/types';

import { Button } from './Button';
import { Card } from './Card';
import { CollapsibleGroup } from './CollapsibleGroup';
import { CompactBookmarkLink } from './CompactBookmarkLink';
import { Icon } from './Icon';

import '../styles/compositions.css';

export type VideoGroupProps = {
  title?: string;
  videoId: string;
  bookmarks: readonly BookmarkItem[];
  defaultChoice: ColorChoice;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onGoToVideo: () => void;
  onDeleteVideo: () => void;
  onSeek: (bookmark: BookmarkItem) => void;
};

export function VideoGroup({
  title,
  videoId,
  bookmarks,
  defaultChoice,
  expanded,
  onExpandedChange,
  onGoToVideo,
  onDeleteVideo,
  onSeek,
}: VideoGroupProps) {
  const displayTitle = title?.trim() || videoId;
  const countLabel = `${bookmarks.length} saved ${bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}`;

  return (
    <Card treatment="raised" className="yb-video-group">
      <CollapsibleGroup
        className="yb-video-collapse"
        title={(
          <span className="yb-video-group-heading">
            <span className="yb-video-group-title" title={displayTitle}>{displayTitle}</span>
            <span className="yb-video-group-count" title={countLabel}>
              <Icon name="bookmark" size="small" />
              <span aria-hidden="true">{bookmarks.length}</span>
              <span className="yb-sr-only">{countLabel}</span>
            </span>
          </span>
        )}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      >
        <div className="yb-video-group-body">
          <div className="yb-video-group-actions">
            <Button variant="neutral" onClick={onGoToVideo} aria-label={`Go to video: ${displayTitle}`}>
              <Icon name="external" size="small" />
              Go to video
            </Button>
            <Button
              variant="quiet"
              className="yb-video-delete"
              onClick={onDeleteVideo}
              aria-label={`Delete saved video: ${displayTitle}, ${countLabel}`}
            >
              <Icon name="trash" size="small" />
              Delete video
            </Button>
          </div>
          <div className="yb-video-group-bookmarks">
            {bookmarks.map(bookmark => (
              <CompactBookmarkLink
                key={bookmark.id}
                bookmark={bookmark}
                defaultChoice={defaultChoice}
                onActivate={() => onSeek(bookmark)}
              />
            ))}
          </div>
        </div>
      </CollapsibleGroup>
    </Card>
  );
}
