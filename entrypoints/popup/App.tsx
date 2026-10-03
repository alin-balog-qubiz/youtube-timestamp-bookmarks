import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

import { getActiveTabContext } from '@/services/active-tab';
import { getSettings } from '@/services/settings-client';

import type { ActiveTabContext } from '@/models/active-tab';
import type { MarkerPreferences } from '@/models/marker-preferences';
import type { PopupPage } from '@/ui';

import { Button, Link, Notice, PopupHeader, Skeleton, ThemeProvider } from '@/ui';
import AllVideosPage from './pages/AllVideosPage';
import ThisVideoPage from './pages/ThisVideoPage';
import SettingsPage from './pages/SettingsPage';

import './App.css';

interface PopupState {
  activeTabContext: ActiveTabContext;
  selectedPage: PopupPage;
  hasSelectedInitialPage: boolean;
}

const activeTabRefreshIntervalMs = 750;

export default function App() {
  const [popupState, setPopupState] = useState<PopupState>({
    activeTabContext: { status: 'loading' },
    selectedPage: 'all-videos',
    hasSelectedInitialPage: false,
  });
  const [preferences, setPreferences] = useState<MarkerPreferences | null>(null);
  const [isReadingSettings, setIsReadingSettings] = useState(true);
  const [settingsReadError, setSettingsReadError] = useState<string | null>(null);
  const [settingsRetryId, setSettingsRetryId] = useState(0);

  const { activeTabContext, selectedPage } = popupState;

  useEffect(() => {
    let isDisposed = false;
    let latestReadId = 0;
    browser.storage.onChanged.addListener(handleSettingsChanged);
    void readSettings();

    return () => {
      isDisposed = true;
      latestReadId++;
      browser.storage.onChanged.removeListener(handleSettingsChanged);
    };

    function handleSettingsChanged(changes: Record<string, unknown>, areaName: string) {
      if (areaName === 'local' && 'marker-preferences:v1' in changes) void readSettings();
    }

    async function readSettings() {
      const readId = ++latestReadId;
      setIsReadingSettings(true);
      try {
        const savedPreferences = await getSettings();
        if (isDisposed || readId !== latestReadId) return;

        setPreferences(savedPreferences);
        setSettingsReadError(null);
      } catch (failure) {
        if (isDisposed || readId !== latestReadId) return;

        setSettingsReadError(failure instanceof Error ? failure.message : 'Unable to load settings.');
      } finally {
        if (!isDisposed && readId === latestReadId) setIsReadingSettings(false);
      }
    }
  }, [settingsRetryId]);

  useEffect(() => {
    let isDisposed = false;
    let latestRefreshId = 0;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    browser.tabs.onActivated.addListener(invalidateContext);
    browser.tabs.onUpdated.addListener(handleTabUpdated);
    browser.tabs.onRemoved.addListener(invalidateContext);

    void refreshContext();

    return () => {
      isDisposed = true;
      latestRefreshId++;
      clearTimeout(refreshTimeout);

      browser.tabs.onActivated.removeListener(invalidateContext);
      browser.tabs.onUpdated.removeListener(handleTabUpdated);
      browser.tabs.onRemoved.removeListener(invalidateContext);
    };

    async function refreshContext() {
      clearTimeout(refreshTimeout);
      const refreshId = ++latestRefreshId;
      const detectedContext = await getActiveTabContext();
      if (isDisposed || refreshId !== latestRefreshId)
        return;

      setPopupState((currentState) => {
        const hasSupportedVideo = detectedContext.status === 'supported';
        const shouldSelectInitialPage = !currentState.hasSelectedInitialPage &&
          detectedContext.status !== 'loading';
        let resolvedPage = currentState.selectedPage;
        if (shouldSelectInitialPage) {
          if (hasSupportedVideo) {
            resolvedPage = 'this-video';
          } else {
            resolvedPage = 'all-videos';
          }
        } else if (currentState.selectedPage === 'this-video' && !hasSupportedVideo) {
          resolvedPage = 'all-videos';
        }

        return {
          activeTabContext: detectedContext,
          selectedPage: resolvedPage,
          hasSelectedInitialPage: currentState.hasSelectedInitialPage || shouldSelectInitialPage,
        };
      });

      // Player availability can change without a tab URL update (metadata/live playback).
      refreshTimeout = setTimeout(refreshContext, activeTabRefreshIntervalMs);
    }

    function invalidateContext() {
      setPopupState((currentState) => {
        let resolvedPage = currentState.selectedPage;
        if (resolvedPage === 'this-video') {
          resolvedPage = 'all-videos';
        }

        return {
          ...currentState,
          activeTabContext: { status: 'loading' },
          selectedPage: resolvedPage,
        };
      });

      void refreshContext();
    }

    function handleTabUpdated(_tabId: number, change: { url?: string; status?: string }, tab: { active: boolean }) {
      if (tab.active && (change.url !== undefined || change.status !== undefined)) 
        invalidateContext();
    }
  }, []);

  function navigate(destinationPage: PopupPage) {
    setPopupState((currentState) => ({
      ...currentState,
      selectedPage: destinationPage,
      hasSelectedInitialPage: true,
    }));
  }

  const contextNotice = activeTabContext.status === 'loading'
    ? <Notice>Checking the active tab…</Notice>
    : activeTabContext.status === 'error'
      ? (
        <Notice variant="error">
          Having trouble reading this tab’s context. Try opening{' '}
          <Link href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</Link>.
        </Notice>
      )
      : null;

  return (
    <ThemeProvider preference={preferences?.theme ?? 'system'} className="popup">
      <PopupHeader
        selectedPage={selectedPage}
        hasActiveVideo={activeTabContext.status === 'supported'}
        onNavigate={navigate}
      />
      <main className="popup-content">
        {contextNotice}
        {settingsReadError && selectedPage !== 'settings' && (
          <Notice variant="error" action={<Button variant="quiet" onClick={() => setSettingsRetryId((id) => id + 1)}>Retry</Button>}>
            {settingsReadError} Appearance and saved color preferences could not be refreshed.
          </Notice>
        )}
        {isReadingSettings && !preferences ? <Skeleton /> : (
          <>
            <section
              id="popup-panel-all-videos"
              role="tabpanel"
              aria-labelledby="popup-tab-all-videos"
              hidden={selectedPage !== 'all-videos'}
              tabIndex={0}
            >
              {selectedPage === 'all-videos' && <AllVideosPage activeTabContext={activeTabContext} />}
            </section>
            <section
              id="popup-panel-this-video"
              role="tabpanel"
              aria-labelledby="popup-tab-this-video"
              hidden={selectedPage !== 'this-video'}
              tabIndex={0}
            >
              <ThisVideoPage activeTabContext={activeTabContext} />
            </section>
            <section
              id="popup-panel-settings"
              role="tabpanel"
              aria-labelledby="popup-tab-settings"
              hidden={selectedPage !== 'settings'}
              tabIndex={0}
            >
              {selectedPage === 'settings' && (
                <SettingsPage
                  preferences={preferences}
                  isReadingSettings={isReadingSettings}
                  readError={settingsReadError}
                  onRetry={() => setSettingsRetryId((id) => id + 1)}
                  onPreferencesChange={setPreferences}
                />
              )}
            </section>
          </>
        )}
      </main>
    </ThemeProvider>
  );
}
