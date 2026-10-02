import { useEffect, useRef, useState } from 'react';

import type { BookmarkDraft, ColorChoice } from '@/ui';

import {
  ActionMenu, BookmarkEditor, Button, CollapsibleGroup, ColorPicker, ConfirmationDialog, Dialog,
  EmptyState, ErrorState, IconButton, ImportPreview, Link, Notice, RadioChoice,
  SearchInput, SectionHeader, SegmentedChoice, Skeleton, Switch, TextInput,
  Tabs, TimestampAdjuster, Toast, Tooltip,
} from '@/ui';

import { sampleDefaultColor, sampleIncoming, sampleSettingsChanges } from './fixtures';

export function InventoryExamples() {
  const [text, setText] = useState('Sample name');
  const [search, setSearch] = useState('effects');
  const [invalidText, setInvalidText] = useState('Reserved sample');
  const [checked, setChecked] = useState(true);
  const [selection, setSelection] = useState('first');
  const [radio, setRadio] = useState('merge');
  const [expanded, setExpanded] = useState<readonly string[]>(['first']);
  const [dialog, setDialog] = useState<'plain' | 'confirm' | 'editor' | 'import' | null>(null);
  const [draft, setDraft] = useState<BookmarkDraft>({ name: 'Boundary sample', timestamp: 0 });
  const [savedDraft, setSavedDraft] = useState<BookmarkDraft>(draft);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | undefined>('Sample operation failed. Retry keeps the draft.');
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(0);
  const [unknownDuration, setUnknownDuration] = useState(false);
  const [contextChanged, setContextChanged] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [sampleTab, setSampleTab] = useState('available');
  const [sampleColor, setSampleColor] = useState<ColorChoice | undefined>();

  const commitTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(commitTimeoutRef.current), []);

  function openDialog(value: typeof dialog) {
    setPending(false);
    setError(undefined);
    if (value === 'editor') setDraft(savedDraft);
    setDialog(value);
  }

  function commitSample(label: string) {
    if (pending || (dialog === 'editor' && contextChanged)) return;
    setPending(true);
    setError(undefined);
    commitTimeoutRef.current = window.setTimeout(() => {
      setPending(false);
      if (failNext) {
        setFailNext(false);
        setError('Sample commit failed; draft retained. Retry or cancel.');
        return;
      }
      if (dialog === 'editor') setSavedDraft(draft);
      setDialog(null);
      setToast(label);
    }, 700);
  }

  const defaultChoice: ColorChoice = sampleDefaultColor;

  return (
    <section id="inventory" className="gallery-section">
      <SectionHeader title="Interactive component inventory" metadata="Isolated sample state" />
      <div className="gallery-inventory-grid">
        <article className="gallery-example">
          <h3>Button / IconButton / Tooltip / Link</h3>
          <div className="gallery-line">
            <Button variant="accent" onClick={() => setToast('Sample accent action complete')}>Accent</Button>
            <Button onClick={() => setToast('Sample neutral action complete')}>Neutral raised</Button>
            <Button variant="danger" onClick={() => openDialog('confirm')}>Destructive</Button>
            <Button variant="quiet" onClick={() => setToast('Sample quiet action complete')}>Quiet</Button>
            <Button disabled>Disabled</Button><Button pending>Saving sample</Button>
            <IconButton label="Sample bookmark action" icon="bookmark" onClick={() => setToast('Sample icon action')} />
            <IconButton label="Disabled sample action" icon="bookmark" disabled />
            <Tooltip content="Tooltip opens on keyboard focus too"><Button variant="quiet">Focus or hover</Button></Tooltip>
            <Link href="#foundations">Inspect foundations</Link>
          </div>
        </article>
        <article className="gallery-example">
          <h3>TextInput / SearchInput</h3>
          <TextInput label="Sample name" value={text} onChange={setText} help="Editable local text." />
          <TextInput label="Invalid sample name" value={invalidText} onChange={setInvalidText} error="This sample value is unavailable." />
          <TextInput label="Disabled input" value={text} onChange={setText} disabled />
          <SearchInput label="Example search" value={search} onChange={setSearch} />
          <p className="yb-muted">Current query: {search || '(cleared)'}</p>
        </article>
        <article className="gallery-example">
          <h3>Switch / SegmentedChoice / RadioChoice</h3>
          <Switch label="Interactive sample switch" checked={checked} onChange={setChecked} />
          <Switch label="Disabled sample switch" checked={false} onChange={setChecked} disabled />
          <Switch label="Pending sample switch" checked pending onChange={setChecked} />
          <SegmentedChoice label="Sample segment" value={selection} onChange={setSelection} options={[
            { value: 'first', label: 'First' }, { value: 'second', label: 'Second' }, { value: 'unavailable', label: 'Unavailable', disabled: true },
          ]} />
          <RadioChoice label="Sample import radio" value={radio} onChange={setRadio} options={[{ value: 'merge', label: 'Merge' }, { value: 'replace', label: 'Replace all' }]} />
          <RadioChoice label="Disabled radio choices" value="merge" onChange={setRadio} disabled options={[{ value: 'merge', label: 'Merge' }, { value: 'replace', label: 'Replace all' }]} />
          <Tabs idPrefix="inventory-tabs" label="Tabs with unavailable destination" value={sampleTab} onChange={setSampleTab}
            options={[{ value: 'available', label: 'Available' }, { value: 'second', label: 'Second' }, { value: 'unavailable', label: 'Unavailable', disabled: true }]} />
          {['available', 'second', 'unavailable'].map((value) => (
            <div key={value} role="tabpanel" id={`inventory-tabs-panel-${value}`} aria-labelledby={`inventory-tabs-tab-${value}`} hidden={sampleTab !== value}>
              {value} panel
            </div>
          ))}
          <ColorPicker label="ColorPicker / inherited, preset and custom" value={sampleColor} defaultChoice={sampleDefaultColor} allowDefault onChange={setSampleColor} />
          <ColorPicker label="Disabled color choice" value={{ type: 'custom', value: '#528a67' }} defaultChoice={sampleDefaultColor} disabled onChange={setSampleColor} />
        </article>
        <article className="gallery-example">
          <h3>CollapsibleGroup / ActionMenu</h3>
          {['first', 'second'].map((id) => <CollapsibleGroup key={id} title={`${id} independent group`} expanded={expanded.includes(id)}
            onExpandedChange={(isExpanded) => setExpanded((current) => isExpanded ? [...current, id] : current.filter((value) => value !== id))}>
            <p>Each panel stays open independently.</p>
          </CollapsibleGroup>)}
          <ActionMenu label="Sample actions" items={[
            { label: 'Edit sample', onSelect: () => openDialog('editor') },
            { label: 'Copy sample link', onSelect: () => setToast('Sample copy feedback') },
            { label: 'Unavailable action', disabled: true, onSelect: () => undefined },
            { label: 'Delete sample', danger: true, onSelect: () => openDialog('confirm') },
          ]} />
        </article>
        <article className="gallery-example">
          <h3>Notice / Toast / Skeleton / EmptyState / ErrorState</h3>
          <Notice>Informational sample notice.</Notice>
          <Notice variant="warning">Warning: this is fixture data only.</Notice>
          <Notice variant="error" action={<Button variant="quiet" onClick={() => setToast('Sample error retried')}>Retry</Button>}>Sample read failed.</Notice>
          <Button onClick={() => setToast('Sample operation succeeded')}>Show success toast</Button>
          <Skeleton rows={2} label="Loading sample bookmarks" />
          <EmptyState title="No saved bookmarks" action={<Link href="https://www.youtube.com/" target="_blank" rel="noreferrer">Open YouTube</Link>}>Save a moment with the player + control.</EmptyState>
          <EmptyState title="No matching videos">Clear the title filter or try another title.</EmptyState>
          <ErrorState onRetry={() => setError(undefined)}>{error ?? 'Retry completed. Use Reset examples to restore the error.'}</ErrorState>
        </article>
        <article className="gallery-example">
          <h3>TimestampAdjuster / dialogs / editor / import</h3>
          <TimestampAdjuster timestamp={timestamp} maxTimestamp={unknownDuration ? null : 10} onChange={setTimestamp} />
          <Switch label="Unknown sample duration" checked={unknownDuration} onChange={setUnknownDuration} />
          <Switch label="Editor context changed" checked={contextChanged} onChange={setContextChanged} />
          <div className="gallery-line">
            <Button onClick={() => openDialog('plain')}>Open dialog</Button>
            <Button onClick={() => openDialog('confirm')}>Open confirmation</Button>
            <Button onClick={() => openDialog('editor')}>Open editor</Button>
            <Button onClick={() => openDialog('import')}>Open import preview</Button>
          </div>
          <p>Last saved draft: {savedDraft.name || 'Unnamed bookmark'} at {savedDraft.timestamp}s. Cancel does not change this value.</p>
          <Switch label="Fail next inventory commit" checked={failNext} onChange={setFailNext} />
        </article>
      </div>
      <Dialog open={dialog === 'plain'} onClose={() => setDialog(null)} title="Sample dialog" description="Focus stays inside; Escape or Cancel restores the trigger."
        pending={pending} footer={<Button disabled={pending} onClick={() => setDialog(null)}>Cancel</Button>}>
        <TextInput label="Dialog sample field" value={text} onChange={setText} />
        <Notice>No production settings or bookmarks are touched.</Notice>
      </Dialog>
      <ConfirmationDialog open={dialog === 'confirm'} onClose={() => setDialog(null)} onConfirm={() => commitSample('Sample confirmation completed')}
        title="Delete sample bookmarks?" description="Boundary sample — 4 sample bookmarks. The YouTube source is unaffected."
        pending={pending} error={error} confirmLabel="Delete sample" />
      <BookmarkEditor open={dialog === 'editor'} onClose={() => setDialog(null)} draft={draft} onDraftChange={setDraft}
        onSave={() => commitSample('Sample editor saved')} maxTimestamp={unknownDuration ? null : 10} defaultChoice={defaultChoice}
        pending={pending} error={error} contextError={contextChanged ? 'The active video changed. Close the editor and reopen it for the current video.' : undefined} />
      <ImportPreview open={dialog === 'import'} onClose={() => setDialog(null)} onConfirm={() => commitSample('Sample import confirmed')}
        fileName="sample-backup.json" mode={mode} onModeChange={(value) => { setMode(value); setAcknowledged(false); }}
        current={{ videos: 2, bookmarks: 6 }} incoming={sampleIncoming} additions={6} duplicates={2} settingsChanges={sampleSettingsChanges}
        acknowledged={acknowledged} onAcknowledgedChange={setAcknowledged} pending={pending} error={error} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
