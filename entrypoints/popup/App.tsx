import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

import { getActiveTabContext } from '@/services/active-tab';

import type { ActiveTabContext } from '@/models/active-tab';
import type { PopupPage } from './types';

import PopupHeader from './components/PopupHeader';
import ContextNotice from './components/ContextNotice';
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

  const { activeTabContext, selectedPage } = popupState;

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

  return (
    <div className="popup">
      <PopupHeader
        selectedPage={selectedPage}
        hasActiveVideo={activeTabContext.status === 'supported'}
        onNavigate={navigate}
      />
      <main aria-labelledby={selectedPage === 'this-video' ? 'this-video-heading' : 'page-heading'}>

        <ContextNotice activeTabContext={activeTabContext} />

        {selectedPage === 'all-videos' && <AllVideosPage activeTabContext={activeTabContext} />}

        <section hidden={selectedPage !== 'this-video'}>
          <ThisVideoPage activeTabContext={activeTabContext} />
        </section>

        {selectedPage === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
