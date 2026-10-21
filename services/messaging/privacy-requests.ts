import { browser } from 'wxt/browser';

import type {
  GetPrivacyConsentRequest,
  GetPrivacyConsentResponse,
  GrantPrivacyConsentRequest,
  GrantPrivacyConsentResponse,
} from '@/models/messages';

export async function getPrivacyConsent(): Promise<boolean> {
  const response = await browser.runtime.sendMessage<GetPrivacyConsentRequest, GetPrivacyConsentResponse>({
    type: 'privacy:get-consent',
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Privacy consent status did not respond');
}

export async function grantPrivacyConsent(): Promise<void> {
  const response = await browser.runtime.sendMessage<GrantPrivacyConsentRequest, GrantPrivacyConsentResponse>({
    type: 'privacy:grant-consent',
  });
  if (response?.ok) return;

  throw new Error(response?.error ?? 'Unable to save privacy consent');
}
