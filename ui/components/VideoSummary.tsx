import { Badge } from './Badge';
import { Card } from './Card';
import { Icon } from './Icon';

import '../styles/compositions.css';

export type VideoSummaryProps = {
  videoId: string;
  title?: string;
  metadata?: string;
  bookmarkCount: number;
};

export function VideoSummary({ videoId, title, metadata, bookmarkCount }: VideoSummaryProps) {
  const displayTitle = title?.trim() || videoId;

  return (
    <Card treatment="raised" className="yb-video-summary">
      <h2 className="yb-video-summary-title" title={displayTitle}>{displayTitle}</h2>
      <div className="yb-video-summary-details">
        {metadata?.trim() && <p className="yb-video-metadata" title={metadata}>{metadata}</p>}
        <Badge><Icon name="bookmark" size="small" />{bookmarkCount} {bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}</Badge>
      </div>
    </Card>
  );
}
