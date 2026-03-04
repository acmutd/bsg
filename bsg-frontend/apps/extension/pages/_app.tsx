import '../../../packages/ui-styles/global.css';
import type { AppProps } from 'next/app';
import '@bsg/ui-styles/global.css';
import { Poppins } from 'next/font/google';
import DefaultPopup from './defaultPopup';
import { HeaderBar } from '@/customComponents/TabBar/HeaderBar';
import { Sidebar } from '@/customComponents/TabBar/Sidebar';
import { useIsCollapsed } from '@/hooks/useIsCollapsed';
import { useIsPanelHovered } from '@/hooks/useIsPanelHovered';

const poppins = Poppins({ weight: '400', subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {

  const isDefaultPopup = (Component === DefaultPopup);
  const isCollapsed = useIsCollapsed();
  const setIsPanelHovered = useIsPanelHovered((s) => s.setIsPanelHovered);

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
    >
      {/* Sidebar */}
      <div className={isCollapsed ? 'flex h-screen' : 'hidden'}>
        <Sidebar />
      </div>

      {/* Main Layout */}
      <div className={isCollapsed ? 'hidden' : 'flex flex-col h-screen'}>
        <HeaderBar />
        <div className="flex-1 flex overflow-x-auto">
          <Component {...pageProps} />
        </div>
      </div>
    </div>
  );
};
