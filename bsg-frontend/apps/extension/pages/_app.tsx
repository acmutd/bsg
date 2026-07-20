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
import { useEffect } from 'react';

const poppins = Poppins({ weight: '400', subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {

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
      console.log('[BSG unread] clearing — chat is active');
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
