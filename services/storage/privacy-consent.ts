import { storage } from 'wxt/utils/storage';

export const privacyConsentStorageKey = 'local:privacy-consent:v1';

const privacyConsent = storage.defineItem<unknown>(privacyConsentStorageKey, { fallback: false });

export async function getPrivacyConsent(): Promise<boolean> {
  return await privacyConsent.getValue() === true;
}

export async function grantPrivacyConsent(): Promise<boolean> {
  await privacyConsent.setValue(true);

  return true;
}
