import { useState } from 'react';
import { Button, Link, Notice } from '@/ui';

interface PrivacyConsentPageProps {
  readonly isCheckingConsent: boolean;
  readonly consentReadError: string | null;
  readonly onRetry: () => void;
  readonly onAccept: () => Promise<void>;
}

export default function PrivacyConsentPage({
  isCheckingConsent, consentReadError, onRetry, onAccept,
}: PrivacyConsentPageProps) {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  return (
    <section className="privacy-consent" aria-labelledby="privacy-consent-title">
      <h1 id="privacy-consent-title">Privacy before you start</h1>
      <p>
        To save a moment, YouTube Bookmarks reads the current YouTube video ID and title, and the playback time when
        you use the save control.
      </p>
      <ul>
        <li>
          Video IDs and titles, saved timestamps, bookmark creation dates, optional names and colors, and your
          appearance, marker, and consent preferences are stored in this browser’s extension storage.
        </li>
        <li>The extension does not send this information to the developer or other parties.</li>
        <li>
          Import reads only a JSON file you choose. Export creates a JSON download only when you request it; exports
          include videos and bookmarks, not preferences.
        </li>
      </ul>
      <label className="privacy-consent-agreement">
        <input
          type="checkbox"
          onChange={(event) => setHasConfirmed(event.currentTarget.checked)}
        />
        <span>I have read and agree to this data use.</span>
      </label>
      {consentReadError && (
        <Notice variant="error" action={<Button variant="quiet" onClick={onRetry}>Retry</Button>}>
          {consentReadError}
        </Notice>
      )}
      {saveError && <Notice variant="error">{saveError}</Notice>}
      <Button
        variant="accent"
        pending={isSaving}
        disabled={!hasConfirmed || isCheckingConsent}
        onClick={() => { void accept(); }}
      >
        Agree and continue
      </Button>
      <p className="privacy-consent-policy">
        <Link
          href="https://github.com/alin-balog-qubiz/youtube-timestamp-bookmarks/blob/main/PRIVACY.md"
          target="_blank"
        >
          Read the full privacy policy
        </Link>
      </p>
      <p className="privacy-consent-close">
        If you do not agree, close this popup. No bookmark or preference data is read until you agree.
      </p>
    </section>
  );

  async function accept() {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onAccept();
    } catch (failure) {
      setSaveError(failure instanceof Error ? failure.message : 'Unable to save your consent. Please retry.');
    } finally {
      setIsSaving(false);
    }
  }

}
