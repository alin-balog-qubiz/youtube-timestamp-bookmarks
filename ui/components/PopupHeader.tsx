import type { PopupPage } from '../utils/types';

import { Tabs } from './Tabs';

import '../styles/compositions.css';

export type PopupHeaderProps = {
  selectedPage: PopupPage;
  hasActiveVideo: boolean;
  onNavigate: (page: PopupPage) => void;
  idPrefix?: string;
};

export function PopupHeader({
  selectedPage,
  hasActiveVideo,
  onNavigate,
  idPrefix = 'popup',
}: PopupHeaderProps) {
  function navigate(page: string) {
    if (page === 'this-video' || page === 'all-videos' || page === 'settings')
      onNavigate(page);
  }

  return (
    <header className="yb-popup-header">
      <h1 className="yb-popup-brand">YouTube Bookmarks</h1>
      <Tabs
        label="Popup navigation"
        value={selectedPage}
        options={[
          { value: 'this-video', label: 'This video', disabled: !hasActiveVideo },
          { value: 'all-videos', label: 'All videos' },
          { value: 'settings', label: 'Settings' },
        ]}
        onChange={navigate}
        idPrefix={idPrefix}
      />
    </header>
  );
}
