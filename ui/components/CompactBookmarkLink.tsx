import { formatTimestamp } from '@/utils/bookmark-time';
import { resolveColorChoice } from '../utils/color';
import { useTheme } from '../utils/theme';

import type { BookmarkItem, ColorChoice } from '../utils/types';

import { Icon } from './Icon';
import { Link } from './Link';

import '../styles/compositions.css';

export type CompactBookmarkLinkProps = {
  bookmark: BookmarkItem;
  defaultChoice: ColorChoice;
  href?: string;
  onActivate?: () => void;
};

export function CompactBookmarkLink({
  bookmark,
  defaultChoice,
  href,
  onActivate,
}: CompactBookmarkLinkProps) {
  const { resolvedTheme } = useTheme();
  const name = bookmark.name?.trim() || 'Unnamed bookmark';
  const timestamp = formatTimestamp(bookmark.timestamp);
  const color = resolveColorChoice(bookmark.color, defaultChoice, resolvedTheme);
  const label = `Play ${name} at ${timestamp}`;
  const content = (
    <>
      <span className="yb-compact-bookmark-dot" style={{ backgroundColor: color }} aria-hidden="true" />
      <time className="yb-bookmark-time" dateTime={`PT${bookmark.timestamp}S`}>{timestamp}</time>
      <span
        className={`yb-compact-bookmark-name${bookmark.name?.trim() ? '' : ' yb-bookmark-unnamed'}`}
        title={name}
      >
        {name}
      </span>
      <span className="yb-compact-bookmark-play"><Icon name="play" size="small" /></span>
    </>
  );

  if (href) {
    return (
      <Link className="yb-compact-bookmark" href={href} onClick={onActivate} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="yb-compact-bookmark"
      onClick={onActivate}
      disabled={!onActivate}
      aria-label={label}
    >
      {content}
    </button>
  );
}
