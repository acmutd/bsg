import type { AppProps } from 'next/app';
import '@bsg/ui-styles/global.css';
import { Poppins } from 'next/font/google';
import DefaultPopup from './defaultPopup';
import { HeaderBar } from '@/customComponents/TabBar/HeaderBar';
import { Sidebar } from '@/customComponents/TabBar/Sidebar';
import { useIsFolded } from '@/hooks/useIsFolded';
import { usePanelStore } from '@/stores/usePanelStore';
import { Toolbar } from '@/customComponents/Toolbar/Toolbar';
import { Footer } from '@/customComponents/Footer/Footer';
import { useRoomStore } from '@/stores/useRoomStore';
import { messageScript } from '@/utils/messageScript';
import { useIsActive } from '@/hooks/useIsActive';
import { useEffect, useState } from 'react';

const poppins = Poppins({ weight: '400', subsets: ['latin'] });

function useThemeSync() {
  useEffect(() => {
    function applyTheme(theme: string) {
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(theme === 'light' ? 'light' : 'dark');
    }

    // Apply initial theme from storage (configReady ensures chrome.storage is ready)
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['themePreference'], (result) => {
        const pref = result.themePreference;
        if (pref && pref !== 'auto') {
          applyTheme(pref);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          applyTheme('light');
        }
      });
    }

    // Listen for theme messages from contentScript
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'BSG_THEME_UPDATE') {
        applyTheme(e.data.theme);
      }
    }
    window.addEventListener('message', handleMessage);

    // Listen for manual theme changes from extension settings
    function handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }) {
      if (changes.themePreference) {
        const pref = changes.themePreference.newValue;
        if (pref && pref !== 'auto') {
          applyTheme(pref);
        }
      }
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);
}

export default function App({ Component, pageProps }: AppProps) {

  useThemeSync();

  const isDefaultPopup = (Component === DefaultPopup);
  const isFolded = useIsFolded();
  const setIsPanelHovered = usePanelStore(s => s.setIsPanelHovered);
  const isInRoom = useRoomStore(s => s.isInRoom);
  const { isActive, setIsActive } = useIsActive();
  const activeTab = useRoomStore(s => s.activeTab);
  const clearUnread = useRoomStore(s => s.clearUnread);

  const setIsFolded = usePanelStore(s => s.setIsFolded);

  useEffect(() => {
    setIsFolded(isFolded);
  }, [isFolded, setIsFolded]);
  
  useEffect(() => {
    if (activeTab === 'chat' && !isFolded) {
      clearUnread();
    }
  }, [activeTab, isFolded, clearUnread]);

  // Redirect popup render
  if (isDefaultPopup) {
    return (
      <div className={poppins.className}>
        <Component  {...pageProps} />
      </div>
    );
  }

  // On Leetcode extension render
  return (
    <div
      className={(isActive) ? 'active' : ''}
      onMouseEnter={() => setIsPanelHovered(true)}
      onMouseLeave={() => setIsPanelHovered(false)}
      onMouseDown={() => { messageScript('ACTIVE'); setIsActive(true); }}
    >
      {/* Sidebar */}
      <div className={(isFolded) ? 'flex h-screen' : 'hidden'}>
        <Sidebar isInRoom={isInRoom}/>
      </div>

      {/* Main Layout */}
      <div className={(isFolded) ? 'hidden' : 'flex flex-col h-screen'}>
        <HeaderBar isInRoom={isInRoom}/>
        <div className="flex-1 flex overflow-x-auto">
          <div className="flex-1 flex flex-col min-w-[24rem] min-w-max">
            {isInRoom && <Toolbar/>}
            <div className="flex-1 overflow-y-auto">
              <Component {...pageProps}/>
            </div>
            <Footer isInRoom={isInRoom}/>
          </div>
        </div>
      </div>
    </div>
  );
};
