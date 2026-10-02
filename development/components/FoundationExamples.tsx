import { useState } from 'react';

import { Badge, Card, Icon, SectionHeader, Surface, useTheme } from '@/ui';

export function FoundationExamples() {
  const [selectedToken, setSelectedToken] = useState('accent');

  const { resolvedTheme } = useTheme();
  const tokens = ['bg', 'panel', 'fg', 'muted', 'border', 'accent', 'danger', 'focus'];

  return (
    <section id="foundations" className="gallery-section">
      <SectionHeader title="Foundations" metadata={`Resolved theme: ${resolvedTheme}`} />
      <p>Installed font stack; no font downloads. Body 14 px, helpers 12 px, titles 16 px. Times use tabular numerals.</p>
      <div className="gallery-token-grid">
        {tokens.map((token) => <button type="button" className="gallery-token" key={token}
          aria-pressed={selectedToken === token} onClick={() => setSelectedToken(token)}>
          <span style={{ background: `var(--yb-${token})` }} />{token}
        </button>)}
      </div>
      <p className="yb-muted">Selected token: {selectedToken}. Focus an example with Tab; hover and hold buttons to inspect real states.</p>
      <div className="gallery-grid">
        <Surface treatment="flat"><strong>Surface / flat</strong><p>Passive lists and notices.</p></Surface>
        <Card><strong>Card / raised</strong><p>Video and settings groups.</p></Card>
        <Surface treatment="recessed"><strong>Surface / recessed</strong><p>Navigation and timestamp wells.</p></Surface>
      </div>
      <div className="gallery-line"><Badge>4 bookmarks</Badge><span className="gallery-time">00:08 · 02:14 · 14:09</span><Icon name="bookmark" label="Labeled bookmark icon" /><Icon name="info" size="small" /><span>Icon: labeled and decorative small stroke examples</span></div>
    </section>
  );
}
