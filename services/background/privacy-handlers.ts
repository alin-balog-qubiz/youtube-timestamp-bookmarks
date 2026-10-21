import { registerMessageHandlers } from '@/services/messaging/register-handlers';
import { getPrivacyConsent, grantPrivacyConsent } from '@/services/storage/privacy-consent';

import type { GetPrivacyConsentResponse, GrantPrivacyConsentResponse } from '@/models/messages';

export function registerPrivacyHandlers(): () => void {
  return registerMessageHandlers({
    'privacy:get-consent': handleGetPrivacyConsent,
    'privacy:grant-consent': handleGrantPrivacyConsent,
  });
}

async function handleGetPrivacyConsent(): Promise<GetPrivacyConsentResponse> {
  return { ok: true, value: await getPrivacyConsent() };
}

async function handleGrantPrivacyConsent(): Promise<GrantPrivacyConsentResponse> {
  return { ok: true, value: await grantPrivacyConsent() };
}
