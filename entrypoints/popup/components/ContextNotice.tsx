import type { ActiveTabContext } from '@/models/active-tab';

interface ContextNoticeProps {
  activeTabContext: ActiveTabContext;
}

export default function ContextNotice({ activeTabContext }: ContextNoticeProps) {
  switch (activeTabContext.status) {
    case 'loading':
      return <p className="notice" role="status">Checking the active tab…</p>;
    case 'error':
      return <p className="notice error" role="alert">{activeTabContext.error} All videos and Settings are still available.</p>;
    case 'outside-youtube':
      return <p className="notice">This tab is outside YouTube. All videos and Settings are still available.</p>;
    default:
      return null;
  }
}
