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
import { useEffect, useRef, useState } from 'react';
import { configReady } from '../lib/config';
import { useSessionInit } from '@/hooks/useSessionInit';
import Logo from '@bsg/components/Logo';

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

  const [configLoaded, setConfigLoaded] = useState(false);

  useThemeSync();

  // Reserve space for the horizontal scrollbar so content (e.g. vertically
  // centered auth cards) never shifts when the scrollbar appears/disappears.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;overflow:scroll;width:100px;height:100px;';
    document.body.appendChild(probe);
    const scrollbarSize = probe.offsetWidth - probe.clientWidth;
    document.body.removeChild(probe);
    if (scrollbarSize > 0) {
      el.style.paddingBottom = `${scrollbarSize}px`;
    }
  }, []);

  useEffect(() => {
    configReady.then(() => setConfigLoaded(true));
  }, []);

  // Only surface an indicator if the restore is actually slow. A spinner that
  // appears and vanishes in 80ms trades the login flash for a worse flicker,
  // so stay blank until the wait is long enough to read as a wait.
  const [isRestoreSlow, setIsRestoreSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsRestoreSlow(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const isDefaultPopup = (Component === DefaultPopup);
  const sessionReady = useSessionInit(!isDefaultPopup);
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

  // Wait for config (chrome.storage.local) to load before rendering
  if (!configLoaded) {
    return <div className={poppins.className} />;
  }

  // TODO: Display a loading screen while active room is being checked (start-page will be loaded only after failure)
  // Effects run after paint, so without this gate login-page shows for a beat
  // on every reload before useSessionInit redirects to start-page/room-page.
  if (!sessionReady) {
    return (
      <div className={`${poppins.className} flex h-screen items-center justify-center`}>
        {(isRestoreSlow && !isFolded) && (
          <div className="flex flex-col items-center text-foreground/40 animate-pulse">
            <Logo />
            <p className="text-sm">Restoring session…</p>
          </div>
        )}
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
          <div className="flex-1 flex flex-col min-w-0">
            {isInRoom && <Toolbar/>}
            <div ref={scrollRef} className="flex-1 overflow-auto">
              <Component {...pageProps}/>
            </div>
            <Footer isInRoom={isInRoom}/>
          </div>
        </div>
      </div>
    </div>
  );
};
