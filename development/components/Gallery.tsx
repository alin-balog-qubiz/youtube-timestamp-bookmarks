import { useState } from 'react';

import { Button, SectionHeader, Switch, ThemeChoice, ThemeProvider, useTheme } from '@/ui';

import { FoundationExamples } from './FoundationExamples';
import { InventoryExamples } from './InventoryExamples';
import { PopupPreview } from './PopupPreview';

import './gallery.css';

export function Gallery() {
  const [resetKey, setResetKey] = useState(0);

  return <ThemeProvider key={resetKey}><GalleryContent onReset={() => setResetKey((current) => current + 1)} /></ThemeProvider>;
}

function GalleryContent({ onReset }: { readonly onReset: () => void }) {
  const [constrained, setConstrained] = useState(false);
  const [manyRows, setManyRows] = useState(false);
  const [longText, setLongText] = useState(false);

  const { preference, resolvedTheme } = useTheme();

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div><p className="gallery-eyebrow">Development components</p><h1>YouTube Bookmarks</h1>
          <p>Native React components. Every example uses isolated fixtures; your library and settings are untouched.</p></div>
        <Button onClick={onReset}>Reset examples</Button>
      </header>
      <div className="gallery-theme-controls"><ThemeChoice /><p>{preference} preference · {resolvedTheme} resolved</p></div>
      <section className="gallery-section" id="popup-preview">
        <SectionHeader title="Popup composition" metadata="560 px wide · up to 700 px tall · bounded by available space" />
        <div className="gallery-line gallery-preview-controls">
          <Switch label="Shortened available height" checked={constrained} onChange={setConstrained} />
          <Switch label="Many sample rows" checked={manyRows} onChange={setManyRows} />
          <Switch label="Long titles and names" checked={longText} onChange={setLongText} />
        </div>
        <PopupPreview constrained={constrained} manyRows={manyRows} longText={longText} />
        <p className="yb-muted">This preview is not proof of native browser-popup height. Fixture controls are labeled below its content.</p>
      </section>
      <FoundationExamples />
      <InventoryExamples />
      <footer className="gallery-footer">ThemeProvider / ThemeChoice, Tabs, ColorPicker, PopupHeader, VideoSummary, BookmarkRow, CompactBookmarkLink, VideoGroup, SettingRow and SettingGroup are exercised in the popup above. Other named examples appear below it. Gallery code is excluded from production builds.</footer>
    </div>
  );
}
