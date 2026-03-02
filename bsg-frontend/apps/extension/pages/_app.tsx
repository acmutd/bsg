import { useState } from 'react';
import '../../../packages/ui-styles/global.css';
import type { AppProps } from 'next/app';
import '@bsg/ui-styles/global.css';
import { Poppins } from 'next/font/google';
import DefaultPopup from './defaultPopup';
import { HeaderBar } from '@bsg/components/tabBar/headerBar';
import { Sidebar } from '@bsg/components/tabBar/sidebar';
import { useIsCollapsed } from '@/hooks/useIsCollapsed';
import { useIsOverflowed } from '@/hooks/useIsOverflowed';

const poppins = Poppins({ weight: '400', subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {

  const isDefaultPopup = (Component === DefaultPopup);
  const isCollapsed = useIsCollapsed();
  const [isHovered, setIsHovered] = useState(false);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {console.log("panel clicked")}}
      className="flex flex-col h-screen"
    >
      {
        isCollapsed ?
        <Sidebar isHovered={isHovered} isInRoom={true} />
        :
        <>
          <HeaderBar isHovered={isHovered} isInRoom={true} />
          <div className="flex-1 flex overflow-x-auto">
            <Component {...pageProps} />
          </div>
        </>
      }
    </div>
  );
};
