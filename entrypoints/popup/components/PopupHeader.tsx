import type { PopupPage } from '../types';

interface PopupHeaderProps {
  readonly selectedPage: PopupPage;
  readonly hasActiveVideo: boolean;
  readonly onNavigate: (page: PopupPage) => void;
}

export default function PopupHeader({ selectedPage, hasActiveVideo, onNavigate }: PopupHeaderProps) {
  return (
    <header className="popup-header">
      <p className="product-name">YouTube Bookmarks</p>
      <nav aria-label="Popup pages">
        <button type="button" aria-current={selectedPage === 'all-videos' ? 'page' : undefined} onClick={() => onNavigate('all-videos')}>
          All videos
        </button>
        {hasActiveVideo && (
          <button type="button" aria-current={selectedPage === 'this-video' ? 'page' : undefined} onClick={() => onNavigate('this-video')}>
            This video
          </button>
        )}
        <button type="button" aria-current={selectedPage === 'settings' ? 'page' : undefined} onClick={() => onNavigate('settings')}>
          Settings
        </button>
      </nav>
    </header>
  );
}
