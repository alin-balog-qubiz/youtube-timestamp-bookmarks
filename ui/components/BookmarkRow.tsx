import { formatTimestamp } from '@/utils/bookmark-time';
import { resolveColorChoice } from '../utils/color';
import { useTheme } from '../utils/theme';

import type { BookmarkItem, ColorChoice } from '../utils/types';

import { ActionMenu } from './ActionMenu';

import '../styles/compositions.css';

export type BookmarkRowProps = {
  bookmark: BookmarkItem;
  defaultChoice: ColorChoice;
  onSeek: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function BookmarkRow({
  bookmark,
  defaultChoice,
  onSeek,
  onEdit,
  onCopy,
  onDelete,
  disabled = false,
}: BookmarkRowProps) {
  const { resolvedTheme } = useTheme();
  const name = bookmark.name?.trim() || 'Unnamed bookmark';
  const timestamp = formatTimestamp(bookmark.timestamp);
  const color = resolveColorChoice(bookmark.color, defaultChoice, resolvedTheme);

  return (
    <div className="yb-bookmark-row">
      <span className="yb-bookmark-marker" style={{ backgroundColor: color }} aria-hidden="true" />
      <button
        type="button"
        className="yb-bookmark-seek"
        aria-label={`Seek to ${name} at ${timestamp}`}
        onClick={onSeek}
        disabled={disabled}
      >
        <time className="yb-bookmark-time" dateTime={`PT${bookmark.timestamp}S`}>{timestamp}</time>
        <span
          className={`yb-bookmark-name${bookmark.name?.trim() ? '' : ' yb-bookmark-unnamed'}`}
          title={name}
        >
          {name}
        </span>
      </button>
      <ActionMenu
        label={`Actions for ${name} at ${timestamp}`}
        disabled={disabled}
        items={[
          { label: 'Edit bookmark', icon: 'edit', onSelect: onEdit },
          { label: 'Copy timestamped link', icon: 'copy', onSelect: onCopy },
          { label: 'Delete bookmark', icon: 'trash', onSelect: onDelete, danger: true },
        ]}
      />
    </div>
  );
}
