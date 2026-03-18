import '../../../packages/ui-styles/global.css';
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

const poppins = Poppins({ weight: '400', subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {

  const isDefaultPopup = (Component === DefaultPopup);
  const isFolded = useIsFolded();
  const setIsPanelHovered = usePanelStore(s => s.setIsPanelHovered);
  const isInRoom = useRoomStore(s => s.isInRoom);

  // TODO: Make active panel hook to mimic LeetCode panel border on click

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
    //<div className={poppins.className}>
    <div
      onMouseEnter={() => setIsPanelHovered(true)}
      onMouseLeave={() => setIsPanelHovered(false)}
      onClick={() => {console.log("panel clicked")}}
      className="overflow-hidden"
    >
      {/* Sidebar */}
      <div className={isFolded ? 'flex h-screen' : 'hidden'}>
        <Sidebar/>
      </div>

      {/* Main Layout */}
      <div className={isFolded ? 'hidden' : 'flex flex-col h-screen'}>
        <HeaderBar/>
        <div className="flex-1 flex overflow-x-auto">
          <div className="flex-1 flex flex-col min-w-[24rem]">
            {isInRoom && <Toolbar/>}
            <div className="flex-1 overflow-y-auto">
              <Component {...pageProps}/>
            </div>
            <Footer/>
          </div>
        </div>
      </div>
    </div>
  );
};
